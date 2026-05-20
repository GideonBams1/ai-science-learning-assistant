"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import DifficultySelector from "@/components/DifficultySelector";
import LearnerDashboard   from "@/components/LearnerDashboard";
import type { Difficulty, LearnerData } from "@/types";
import { loadLearnerData, setDifficulty } from "@/lib/learningStore";

// ChatInterface has Mermaid (browser-only) so skip SSR
const ChatInterface = dynamic(() => import("@/components/ChatInterface"), { ssr: false });

// ── Decorative star field ─────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id:    i,
  x:     Math.round((i * 137.5) % 100 * 10) / 10,
  y:     Math.round((i * 97.3)  % 100 * 10) / 10,
  size:  i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  delay: Math.round((i * 0.23) % 4 * 10) / 10,
}));

type Tab = "chat" | "dashboard";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab,         setTab]         = useState<Tab>("chat");
  const [learnerData, setLearnerData] = useState<LearnerData | null>(null);
  const [hydrated,    setHydrated]    = useState(false);

  // Load learner data only on client (localStorage)
  useEffect(() => {
    setLearnerData(loadLearnerData());
    setHydrated(true);
  }, []);

  const handleLearnerUpdate = useCallback((data: LearnerData) => {
    setLearnerData(data);
  }, []);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    if (!learnerData) return;
    const updated = setDifficulty(learnerData, d);
    setLearnerData(updated);
  }, [learnerData]);

  const handleReset = useCallback(() => {
    setLearnerData(loadLearnerData());
  }, []);

  const difficulty: Difficulty = learnerData?.difficulty ?? "beginner";

  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#050818]" />
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-[10%] right-[-15%] h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[5%] left-[20%] h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
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

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── NAV ── */}
        <nav className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-8 border-b border-white/5 backdrop-blur-sm bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm shadow-lg shadow-blue-500/30">
              🔭
            </div>
            <span className="text-sm font-bold tracking-wide text-white/90">ScienceAI</span>
          </div>

          {/* Stats in nav */}
          {hydrated && learnerData && (
            <div className="hidden sm:flex items-center gap-4 text-xs text-white/40">
              <span>📚 {Object.keys(learnerData.topicRecords).length} topics</span>
              <span>🧪 {learnerData.totalQuizzes} quizzes</span>
              <span>🔥 {learnerData.streakDays} day streak</span>
            </div>
          )}

          <div className="flex items-center gap-2">
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

        {/* ── Main layout: sidebar + content ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left sidebar ── */}
          <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col border-r border-white/5 bg-black/10 backdrop-blur-sm">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* App intro */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-xs font-bold text-white/70 mb-1">AI Science Tutor</h2>
                <p className="text-xs text-white/40 leading-relaxed">
                  Ask any science question. I'll explain, illustrate, diagram, and quiz you — adapting to your learning as we go.
                </p>
              </div>

              {/* Difficulty */}
              {hydrated && (
                <div>
                  <p className="text-xs font-semibold text-white/50 mb-2 px-1">DIFFICULTY</p>
                  <DifficultySelector
                    value={difficulty}
                    onChange={handleDifficultyChange}
                    disabled={false}
                  />
                </div>
              )}

              {/* Quick stats */}
              {hydrated && learnerData && Object.keys(learnerData.topicRecords).length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-white/50">YOUR PROGRESS</p>
                  <div className="space-y-1.5 text-xs text-white/60">
                    <div className="flex justify-between">
                      <span>Topics studied</span>
                      <span className="text-white/90">{Object.keys(learnerData.topicRecords).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quizzes taken</span>
                      <span className="text-white/90">{learnerData.totalQuizzes}</span>
                    </div>
                    {learnerData.totalQuizzes > 0 && (
                      <div className="flex justify-between">
                        <span>Accuracy</span>
                        <span className="text-white/90">
                          {Math.round((learnerData.totalCorrect / learnerData.totalQuestions) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setTab("dashboard")}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-all hover:border-blue-400/30 hover:text-blue-300"
                  >
                    View full dashboard →
                  </button>
                </div>
              )}

              {/* Features list */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white/50 mb-3">FEATURES</p>
                <ul className="space-y-2 text-xs text-white/50">
                  {[
                    ["💬", "Multi-turn conversation"],
                    ["📊", "Auto concept diagrams"],
                    ["🖼️", "AI illustrations"],
                    ["🧪", "Smart quizzes"],
                    ["🎯", "Gap identification"],
                    ["📈", "Progress tracking"],
                  ].map(([icon, label]) => (
                    <li key={label} className="flex items-center gap-2">
                      <span>{icon}</span><span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* ── Centre: tabs + content ── */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">

            {/* Tab bar */}
            <div className="shrink-0 flex items-center gap-1 border-b border-white/5 px-4 pt-3 pb-0 bg-black/5">
              {(["chat", "dashboard"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative px-4 py-2 text-sm font-semibold transition-all capitalize
                    ${tab === t
                      ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-blue-400 after:to-violet-400"
                      : "text-white/40 hover:text-white/70"
                    }`}
                >
                  {t === "chat" ? "💬 Chat" : "📊 Dashboard"}
                </button>
              ))}

              {/* Mobile difficulty pill */}
              {hydrated && (
                <div className="ml-auto lg:hidden">
                  <select
                    value={difficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 backdrop-blur-sm focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              )}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {tab === "chat" && hydrated && learnerData ? (
                <ChatInterface
                  difficulty={difficulty}
                  learnerData={learnerData}
                  onLearnerUpdate={handleLearnerUpdate}
                />
              ) : tab === "chat" ? (
                // SSR placeholder
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />
                </div>
              ) : tab === "dashboard" && hydrated && learnerData ? (
                <div className="h-full overflow-y-auto px-4 py-4 max-w-2xl mx-auto w-full">
                  <LearnerDashboard
                    learnerData={learnerData}
                    onReset={handleReset}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="shrink-0 border-t border-white/5 py-3 text-center">
          <p className="text-xs text-white/20">
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
