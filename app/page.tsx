"use client";

import { useState } from "react";
import DifficultySelector from "@/components/DifficultySelector";
import QuestionInput      from "@/components/QuestionInput";
import ExplanationDisplay from "@/components/ExplanationDisplay";
import QuizSection        from "@/components/QuizSection";
import LoadingSpinner     from "@/components/LoadingSpinner";
import type { Difficulty, ExplanationResponse, QuizResponse, ApiError } from "@/types";

// ── fetch helpers ─────────────────────────────────────────────────────────────
async function fetchExplanation(question: string, difficulty: Difficulty): Promise<ExplanationResponse> {
  const res  = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, difficulty }) });
  const data = await res.json();
  if (!res.ok) throw new Error((data as ApiError).error ?? "Failed to get explanation.");
  return data as ExplanationResponse;
}

async function fetchQuiz(topic: string, difficulty: Difficulty): Promise<QuizResponse> {
  const res  = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, difficulty, count: 5 }) });
  const data = await res.json();
  if (!res.ok) throw new Error((data as ApiError).error ?? "Failed to generate quiz.");
  return data as QuizResponse;
}

// ── decorative star field ─────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x:    Math.round((i * 137.5) % 100 * 10) / 10,
  y:    Math.round((i * 97.3)  % 100 * 10) / 10,
  size: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  delay: Math.round((i * 0.23) % 4 * 10) / 10,
}));

const SCIENCE_SUBJECTS = [
  { icon: "⚛️",  label: "Physics"    },
  { icon: "🧬",  label: "Biology"    },
  { icon: "🧪",  label: "Chemistry"  },
  { icon: "🌍",  label: "Earth Sci"  },
  { icon: "🚀",  label: "Astronomy"  },
  { icon: "🧠",  label: "Neuroscience" },
];

const FEATURE_PILLS = [
  { icon: "⚡", text: "Instant answers"     },
  { icon: "🎯", text: "3 difficulty levels" },
  { icon: "🧪", text: "Auto-quiz generator" },
  { icon: "✨", text: "Key takeaways"       },
];

// ── page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [question,    setQuestion]    = useState("");
  const [difficulty,  setDifficulty]  = useState<Difficulty>("beginner");
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [quiz,        setQuiz]        = useState<QuizResponse | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [loadingQuiz,    setLoadingQuiz]    = useState(false);
  const [explainError,   setExplainError]   = useState<string | null>(null);
  const [quizError,      setQuizError]      = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim() || loadingExplain) return;
    setLoadingExplain(true); setExplainError(null); setExplanation(null); setQuiz(null);
    try   { setExplanation(await fetchExplanation(question.trim(), difficulty)); }
    catch (err) { setExplainError(err instanceof Error ? err.message : "Something went wrong."); }
    finally     { setLoadingExplain(false); }
  };

  const handleGenerateQuiz = async () => {
    if (!explanation || loadingQuiz) return;
    setLoadingQuiz(true); setQuizError(null); setQuiz(null);
    try   { setQuiz(await fetchQuiz(explanation.topic, difficulty)); }
    catch (err) { setQuizError(err instanceof Error ? err.message : "Something went wrong."); }
    finally     { setLoadingQuiz(false); }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Background: deep space gradient ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050818]" />
        {/* Nebula blobs */}
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[10%] right-[-15%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[20%] h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
        {/* Stars */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {STARS.map((s) => (
            <circle
              key={s.id}
              cx={`${s.x}%`} cy={`${s.y}%`}
              r={s.size} fill="white"
              style={{ animation: `twinkle ${2 + s.delay}s ease-in-out ${s.delay}s infinite` }}
              opacity={0.4}
            />
          ))}
        </svg>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10">

        {/* ── NAV ── */}
        <nav className="flex items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm shadow-lg shadow-blue-500/30">
              🔭
            </div>
            <span className="text-sm font-bold tracking-wide text-white/90">ScienceAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/40 sm:block">
              Built by{" "}
              <span className="font-semibold text-white/70">Gideon Bams</span>
            </span>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs text-white/60">AI-Powered</span>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <header className="mx-auto max-w-4xl px-4 pb-12 pt-10 text-center sm:pt-16">

          {/* Badge */}
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300 backdrop-blur-sm">
            <span className="animate-pulse">✦</span>
            Designed &amp; Built by Gideon Bams
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 mb-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Explore </span>
            <span className="relative bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Science
            </span>
            <br />
            <span className="text-white">Like Never Before</span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mb-8 max-w-xl text-balance text-base text-slate-400 sm:text-lg">
            Ask any question across Physics, Biology, Chemistry and more.
            Get crystal-clear explanations tuned to your level — then test yourself instantly.
          </p>

          {/* Feature pills */}
          <div className="animate-fade-in-up delay-300 mb-10 flex flex-wrap justify-center gap-2">
            {FEATURE_PILLS.map((f) => (
              <span
                key={f.text}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm"
              >
                <span>{f.icon}</span>{f.text}
              </span>
            ))}
          </div>

          {/* Subject chips */}
          <div className="animate-fade-in-up delay-400 flex flex-wrap justify-center gap-2">
            {SCIENCE_SUBJECTS.map((s) => (
              <button
                key={s.label}
                onClick={() => setQuestion(`Explain the fundamentals of ${s.label}`)}
                className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm transition-all duration-200 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-300"
              >
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
        </header>

        {/* ── MAIN CARD ── */}
        <main className="mx-auto max-w-2xl px-4 pb-24">

          <div className="animate-fade-in-up delay-500 relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            {/* Subtle inner glow */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5" />

            <div className="relative space-y-6">
              <DifficultySelector
                value={difficulty}
                onChange={(d) => { setDifficulty(d); setExplanation(null); setQuiz(null); }}
                disabled={loadingExplain || loadingQuiz}
              />
              <QuestionInput
                value={question}
                onChange={setQuestion}
                onSubmit={handleAsk}
                isLoading={loadingExplain}
                disabled={loadingQuiz}
              />
            </div>
          </div>

          {/* ── Error: explanation ── */}
          {explainError && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300 backdrop-blur-sm animate-fade-in-up">
              <span className="font-semibold">⚠️ Error: </span>{explainError}
            </div>
          )}

          {/* ── Loading: explanation ── */}
          {loadingExplain && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🔭</div>
              </div>
              <p className="animate-pulse text-sm text-slate-400">Generating your explanation…</p>
            </div>
          )}

          {/* ── Explanation result ── */}
          {explanation && !loadingExplain && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl animate-fade-in-up sm:p-8">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5" />
              <ExplanationDisplay
                data={explanation}
                difficulty={difficulty}
                onGenerateQuiz={handleGenerateQuiz}
                isGeneratingQuiz={loadingQuiz}
              />
            </div>
          )}

          {/* ── Error: quiz ── */}
          {quizError && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300 backdrop-blur-sm animate-fade-in-up">
              <span className="font-semibold">⚠️ Quiz Error: </span>{quizError}
            </div>
          )}

          {/* ── Loading: quiz ── */}
          {loadingQuiz && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🧪</div>
              </div>
              <p className="animate-pulse text-sm text-slate-400">Building your quiz…</p>
            </div>
          )}

          {/* ── Quiz result ── */}
          {quiz && !loadingQuiz && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl animate-fade-in-up sm:p-8">
              <QuizSection
                data={quiz}
                onRetry={handleGenerateQuiz}
                isRetrying={loadingQuiz}
              />
            </div>
          )}
        </main>

        {/* ── FOOTER ── */}
        <footer className="pb-10 text-center space-y-1">
          <p className="text-sm font-semibold text-white/30">
            Designed &amp; Built by{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent font-bold">
              Gideon Bams
            </span>
          </p>
         
        </footer>
      </div>
    </div>
  );
}
