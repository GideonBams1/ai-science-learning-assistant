"use client";

import { cn } from "@/lib/utils";
import type { ExplanationResponse, Difficulty } from "@/types";
import { DIFFICULTY_LABELS } from "@/types";

interface ExplanationDisplayProps {
  data:             ExplanationResponse;
  difficulty:       Difficulty;
  onGenerateQuiz:   () => void;
  isGeneratingQuiz: boolean;
}

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  beginner:     "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
  intermediate: "bg-amber-500/20  text-amber-300  border-amber-400/30",
  advanced:     "bg-violet-500/20 text-violet-300 border-violet-400/30",
};

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-blue-300'>$1</code>")
    .replace(/^[*\-] (.+)$/gm, "<li class='ml-4 list-disc marker:text-blue-400'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal marker:text-blue-400'>$1</li>")
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="my-2 space-y-1">${m}</ul>`)
    .replace(/\n\n+/g, '</p><p class="mb-3">')
    .replace(/^(.)/m, '<p class="mb-3">$1')
    .concat("</p>");
}

export default function ExplanationDisplay({ data, difficulty, onGenerateQuiz, isGeneratingQuiz }: ExplanationDisplayProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-white">📖 {data.topic}</h2>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", DIFFICULTY_BADGE[difficulty])}>
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      </div>

      {/* Explanation body */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div
          className="text-sm leading-relaxed text-slate-300"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(data.explanation) }}
        />
      </div>

      {/* Key points */}
      {data.keyPoints?.length > 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-300">
            <span>✨</span> Key Takeaways
          </h3>
          <ul className="space-y-2">
            {data.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-200/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/30 text-[10px] font-bold text-blue-300">
                  {i + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate quiz CTA */}
      <button
        type="button"
        onClick={onGenerateQuiz}
        disabled={isGeneratingQuiz}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-violet-500/30",
          "bg-violet-500/10 px-6 py-3.5 text-sm font-semibold text-violet-300",
          "hover:border-violet-400/50 hover:bg-violet-500/20 transition-all duration-200",
          "hover:scale-[1.01] active:scale-[0.99]",
          "focus:outline-none focus:ring-2 focus:ring-violet-500/40",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        )}
      >
        <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
        {isGeneratingQuiz ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
            Generating quiz…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🧪</span> Test Your Knowledge — Generate Quiz
          </span>
        )}
      </button>
    </div>
  );
}
