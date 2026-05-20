"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessageComponent from "./ChatMessage";
import QuizSection from "./QuizSection";
import type {
  ChatMessage,
  ChatApiResponse,
  QuizResponse,
  Difficulty,
  LearnerData,
  ApiError,
} from "@/types";
import { getLearnerSummary, recordTopicStudied, recordQuizResult } from "@/lib/learningStore";

// ── ID helper ─────────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props {
  difficulty:     Difficulty;
  learnerData:    LearnerData;
  onLearnerUpdate: (data: LearnerData) => void;
}

const SUGGESTED_QUESTIONS = [
  "How does photosynthesis work?",
  "Explain Newton's laws of motion",
  "What is DNA and how does it store information?",
  "How do black holes form?",
  "What causes the Northern Lights?",
  "Explain quantum entanglement simply",
];

export default function ChatInterface({ difficulty, learnerData, onLearnerUpdate }: Props) {
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [activeQuiz,  setActiveQuiz]  = useState<{ quiz: QuizResponse; topic: string } | null>(null);
  const [pendingQuizMsgId, setPendingQuizMsgId] = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeQuiz]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const sendMessage = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setError(null);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Add user message
    const userMsg: ChatMessage = {
      id:        uid(),
      role:      "user",
      content:   trimmed,
      timestamp: Date.now(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const summary = getLearnerSummary(learnerData);

      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages:    updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          difficulty,
          learnerData: summary,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error((data as ApiError).error ?? "Failed to get response.");

      const chat = data as ChatApiResponse;

      // Build assistant message
      const assistantMsg: ChatMessage = {
        id:           uid(),
        role:         "assistant",
        content:      chat.content,
        timestamp:    Date.now(),
        topic:        chat.topic,
        comprehension: chat.comprehension,
        diagram:      chat.diagram,
        illustration: chat.illustration,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Record topic studied
      const updated = recordTopicStudied(learnerData, chat.topic, chat.comprehension);
      onLearnerUpdate(updated);

      // Auto-trigger quiz if AI says so
      if (chat.triggerQuiz && chat.quizTopic) {
        setPendingQuizMsgId(assistantMsg.id);
        await generateQuiz(chat.quizTopic, updated);
        setPendingQuizMsgId(null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [messages, difficulty, learnerData, onLearnerUpdate]);

  const generateQuiz = async (topic: string, currentData: LearnerData) => {
    setIsQuizLoading(true);
    try {
      const res  = await fetch("/api/quiz", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic, difficulty, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as ApiError).error ?? "Failed to generate quiz.");
      setActiveQuiz({ quiz: data as QuizResponse, topic });
      return currentData;
    } catch {
      // If quiz fails, silently skip — don't interrupt the conversation
      return currentData;
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleManualQuiz = useCallback(async (topic: string) => {
    if (isQuizLoading) return;
    setPendingQuizMsgId("manual");
    await generateQuiz(topic, learnerData);
    setPendingQuizMsgId(null);
  }, [isQuizLoading, difficulty, learnerData]);

  const handleQuizFinish = useCallback((correct: number, total: number) => {
    if (!activeQuiz) return;
    const updated = recordQuizResult(learnerData, activeQuiz.topic, correct, total);
    onLearnerUpdate(updated);

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const feedback = score >= 80
      ? `Great job! You scored **${score}%** on ${activeQuiz.topic}. 🎉`
      : score >= 50
        ? `You scored **${score}%** on ${activeQuiz.topic}. Let's keep practising! 💪`
        : `You scored **${score}%** on ${activeQuiz.topic}. Don't worry — let's revisit this topic together.`;

    const resultMsg: ChatMessage = {
      id:        uid(),
      role:      "assistant",
      content:   feedback,
      timestamp: Date.now(),
      topic:     activeQuiz.topic,
    };
    setMessages((prev) => [...prev, resultMsg]);
    setActiveQuiz(null);
  }, [activeQuiz, learnerData, onLearnerUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Welcome screen ───────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Welcome card */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-3xl shadow-xl shadow-blue-500/20">
            🔭
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Start learning science</h2>
          <p className="mb-8 max-w-md text-sm text-slate-400">
            Ask anything — I'll explain clearly, show diagrams, generate illustrations, and quiz you when you're ready.
          </p>

          {/* Suggested questions */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-xl w-full">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70 backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-4 py-4">
          <ChatInputBar
            input={input}
            inputRef={inputRef}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSend={() => sendMessage(input)}
          />
        </div>
      </div>
    );
  }

  // ── Conversation view ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <ChatMessageComponent
            key={msg.id}
            message={msg}
            onStartQuiz={handleManualQuiz}
            quizPending={isQuizLoading && pendingQuizMsgId === msg.id}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-sm shadow-lg shadow-blue-500/20">
              🔭
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {/* Active quiz */}
        {activeQuiz && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xl">🧪</span>
              <h3 className="font-bold text-white">Quick Assessment: {activeQuiz.topic}</h3>
            </div>
            <QuizSection
              data={activeQuiz.quiz}
              onRetry={() => generateQuiz(activeQuiz.topic, learnerData)}
              isRetrying={isQuizLoading}
              onComplete={handleQuizFinish}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <ChatInputBar
          input={input}
          inputRef={inputRef}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={() => sendMessage(input)}
        />
      </div>
    </div>
  );
}

// ── Input bar sub-component ───────────────────────────────────────────────────
interface InputBarProps {
  input:          string;
  inputRef:       React.RefObject<HTMLTextAreaElement>;
  isLoading:      boolean;
  onInputChange:  (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown:      (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend:         () => void;
}

function ChatInputBar({ input, inputRef, isLoading, onInputChange, onKeyDown, onSend }: InputBarProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything about science… (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/30 backdrop-blur-sm transition-all focus:border-blue-500/40 focus:outline-none focus:ring-1 focus:ring-blue-500/20 disabled:opacity-50"
          style={{ maxHeight: 160 }}
        />
      </div>
      <button
        onClick={onSend}
        disabled={!input.trim() || isLoading}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-violet-500 hover:shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Send"
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
