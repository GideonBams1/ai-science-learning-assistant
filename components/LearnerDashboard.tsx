"use client";

import type { LearnerData, TopicRecord, LearningGap } from "@/types";
import {
  getLearningGaps,
  getStrongTopics,
  getOverallAccuracy,
  clearAllData,
} from "@/lib/learningStore";

interface Props {
  learnerData:  LearnerData;
  onReset:      () => void;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon:  string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border ${color} bg-white/5 p-4 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, label }: { score: number; label?: string }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      {label && <span className="w-24 shrink-0 truncate text-xs text-white/60">{label}</span>}
      <div className="flex-1 rounded-full bg-white/10 h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-white/70">{score}%</span>
    </div>
  );
}

// ── Topic row ─────────────────────────────────────────────────────────────────
function TopicRow({ record }: { record: TopicRecord }) {
  const score = record.quizzesTaken > 0 ? record.avgScore : record.comprehension;
  const scoreColor = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{record.topic}</p>
        <p className="text-xs text-white/30">
          {record.timesStudied} session{record.timesStudied !== 1 ? "s" : ""}
          {record.quizzesTaken > 0 && ` · ${record.quizzesTaken} quiz${record.quizzesTaken !== 1 ? "zes" : ""}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${scoreColor}`}>
          {record.quizzesTaken > 0 ? `${record.avgScore}%` : "–"}
        </p>
        <p className="text-xs text-white/30">
          {record.quizzesTaken > 0 ? "avg score" : "no quiz yet"}
        </p>
      </div>
    </div>
  );
}

// ── Gap card ──────────────────────────────────────────────────────────────────
function GapCard({ gap }: { gap: LearningGap }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white/90">{gap.topic}</p>
          <p className="mt-0.5 text-xs text-white/40">{gap.suggestion}</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold text-red-400">
          {gap.score}%
        </span>
      </div>
      <div className="mt-3">
        <ScoreBar score={gap.score} />
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function LearnerDashboard({ learnerData, onReset }: Props) {
  const topics         = Object.values(learnerData.topicRecords).sort((a, b) => b.lastStudied - a.lastStudied);
  const gaps           = getLearningGaps(learnerData);
  const strongTopics   = getStrongTopics(learnerData);
  const overallAccuracy = getOverallAccuracy(learnerData);
  const topicsCount    = topics.length;

  const handleReset = () => {
    if (!window.confirm("This will clear all your progress. Are you sure?")) return;
    clearAllData();
    onReset();
  };

  // Empty state
  if (topicsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="mb-4 text-5xl">📊</div>
        <h3 className="mb-2 text-lg font-bold text-white">No data yet</h3>
        <p className="max-w-sm text-sm text-slate-400">
          Start chatting with the AI tutor to see your learning progress here. Your topics, quiz scores, and gaps will appear as you learn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1 py-2">

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Topics Studied"
          value={topicsCount}
          icon="📚"
          color="border-blue-500/20"
        />
        <StatCard
          label="Quizzes Taken"
          value={learnerData.totalQuizzes}
          icon="🧪"
          color="border-violet-500/20"
        />
        <StatCard
          label="Overall Accuracy"
          value={learnerData.totalQuizzes > 0 ? `${overallAccuracy}%` : "—"}
          icon="🎯"
          color={overallAccuracy >= 70 ? "border-emerald-500/20" : "border-amber-500/20"}
        />
        <StatCard
          label="Day Streak"
          value={learnerData.streakDays}
          icon="🔥"
          color="border-orange-500/20"
        />
      </div>

      {/* Learning gaps */}
      {gaps.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">⚠️ Learning Gaps</h3>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">{gaps.length} topic{gaps.length !== 1 ? "s" : ""}</span>
          </div>
          <p className="mb-3 text-xs text-white/40">Topics where you scored below 70% — focus on these first.</p>
          <div className="space-y-2">
            {gaps.map((g) => <GapCard key={g.topic} gap={g} />)}
          </div>
        </section>
      )}

      {/* Strong topics */}
      {strongTopics.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">✅ Strong Topics</h3>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">{strongTopics.length}</span>
          </div>
          <div className="space-y-2">
            {strongTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
                <span className="text-emerald-400 text-sm">⭐</span>
                <span className="flex-1 text-sm text-white/80">{t.topic}</span>
                <span className="text-sm font-bold text-emerald-400">{t.bestScore}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All topics */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-white">📖 All Topics</h3>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 backdrop-blur-sm">
          {topics.map((t) => <TopicRow key={t.topic} record={t} />)}
        </div>
      </section>

      {/* Quiz accuracy breakdown — only if quizzes taken */}
      {learnerData.totalQuizzes > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold text-white">📈 Quiz Scores by Topic</h3>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            {topics
              .filter((t) => t.quizzesTaken > 0)
              .sort((a, b) => b.avgScore - a.avgScore)
              .map((t) => (
                <ScoreBar key={t.topic} score={t.avgScore} label={t.topic} />
              ))}
          </div>
        </section>
      )}

      {/* Personalised recommendations */}
      {gaps.length > 0 && (
        <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="mb-2 text-sm font-bold text-blue-300">💡 Recommended next steps</h3>
          <ul className="space-y-1.5 text-xs text-white/60">
            {gaps.slice(0, 3).map((g) => (
              <li key={g.topic} className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">→</span>
                <span>{g.suggestion}</span>
              </li>
            ))}
            {strongTopics.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-blue-400">→</span>
                <span>You excel at {strongTopics[0].topic} — try a harder difficulty to challenge yourself further.</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Reset */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={handleReset}
          className="text-xs text-white/20 hover:text-red-400 transition-colors"
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}
