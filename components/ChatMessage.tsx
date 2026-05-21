"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ChatMessage as ChatMessageType } from "@/types";

const MermaidDiagram = dynamic(() => import("./MermaidDiagram"), { ssr: false });

interface Props {
  message:      ChatMessageType;
  onStartQuiz?: (topic: string) => void;
  quizPending?: boolean;
}

// ── Lightweight inline markdown renderer ──────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (/^[-*]\s+/.test(line))
      return <li key={i} className="ml-4 list-disc text-slate-300">{inlineParse(line.replace(/^[-*]\s+/, ""))}</li>;
    if (/^\d+\.\s+/.test(line))
      return <li key={i} className="ml-4 list-decimal text-slate-300">{inlineParse(line.replace(/^\d+\.\s+/, ""))}</li>;
    if (/^##\s+/.test(line))
      return <h3 key={i} className="mt-3 mb-1 text-sm font-bold text-white/90">{line.replace(/^##\s+/, "")}</h3>;
    if (/^#\s+/.test(line))
      return <h2 key={i} className="mt-3 mb-1 text-base font-bold text-white">{line.replace(/^#\s+/, "")}</h2>;
    if (line.trim() === "")
      return <span key={i} className="block h-2" />;
    return <p key={i} className="text-slate-300 leading-relaxed">{inlineParse(line)}</p>;
  });
}

function inlineParse(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono text-cyan-300">{part.slice(1, -1)}</code>;
    return part;
  });
}

// ── Diagram loader — fetches plain-text mermaid from /api/diagram ─────────────
function DiagramLoader({ topic, title }: { topic: string; title: string }) {
  const [code,    setCode]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    fetch("/api/diagram", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ topic }),
    })
      .then((r) => {
        if (r.status === 204) return ""; // model gave nothing usable — skip silently
        if (!r.ok) throw new Error("bad response");
        return r.text();
      })
      .then((text) => {
        if (!cancelled) { setCode(text.trim() || null); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setFailed(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [topic]);

  if (loading)
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
        <span className="text-xs text-white/40">Generating diagram…</span>
      </div>
    );

  if (failed || !code) return null;

  return <MermaidDiagram code={code} title={title} />;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChatMessageComponent({ message, onStartQuiz, quizPending }: Props) {
  const isUser = message.role === "user";
  const [imgError,  setImgError]  = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleImgError = useCallback(() => setImgError(true),  []);
  const handleImgLoad  = useCallback(() => setImgLoaded(true), []);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start`}>

      {/* Avatar */}
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm
        ${isUser
          ? "bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20"
          : "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20"
        } text-white`}
      >
        {isUser ? "👤" : "🔭"}
      </div>

      {/* Bubble + attachments */}
      <div className={`group max-w-[85%] space-y-3 ${isUser ? "items-end" : "items-start"}`}>

        {/* Text bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-lg
          ${isUser
            ? "rounded-tr-sm bg-gradient-to-br from-violet-600/40 to-blue-600/40 border border-violet-500/20 backdrop-blur-sm"
            : "rounded-tl-sm bg-white/5 border border-white/10 backdrop-blur-sm"
          }`}
        >
          <div className="space-y-0.5 text-sm">
            {isUser
              ? <p className="text-white/90">{message.content}</p>
              : renderMarkdown(message.content)
            }
          </div>
        </div>

        {/* Diagram (fetched lazily) */}
        {!isUser && message.diagramTopic && (
          <DiagramLoader
            topic={message.diagramTopic}
            title={message.diagramTitle ?? message.diagramTopic}
          />
        )}

        {/* AI Illustration */}
        {!isUser && message.illustration && !imgError && (
          <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
            {!imgLoaded && (
              <div className="flex h-40 items-center justify-center bg-white/5">
                <span className="animate-pulse text-xs text-white/40">Loading illustration…</span>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.illustration.url}
              alt={message.illustration.alt}
              className={`w-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0 h-0"}`}
              onLoad={handleImgLoad}
              onError={handleImgError}
            />
            <p className="px-3 py-1.5 text-xs text-white/30 bg-black/30">{message.illustration.alt}</p>
          </div>
        )}

        {/* Quiz trigger button */}
        {!isUser && onStartQuiz && message.topic && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onStartQuiz(message.topic!)}
              disabled={quizPending}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-all hover:border-violet-400/50 hover:bg-violet-500/20 disabled:opacity-40"
            >
              {quizPending
                ? <><span className="animate-spin">⟳</span> Generating quiz…</>
                : <>🧪 Test your knowledge on <strong>{message.topic}</strong></>
              }
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className="px-1 text-xs text-white/20">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
