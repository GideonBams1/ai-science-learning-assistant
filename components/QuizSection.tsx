"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { QuizResponse, QuizQuestion } from "@/types";

interface QuizSectionProps {
  data:       QuizResponse;
  onRetry:    () => void;
  isRetrying: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function QuizCard({ question, index }: { question: QuizQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered  = selected !== null;
  const isCorrect = selected === question.answer;

  return (
    <div className={cn(
      "rounded-xl border p-5 transition-colors duration-300",
      !answered  ? "border-white/10 bg-white/5" :
      isCorrect  ? "border-emerald-500/30 bg-emerald-500/10" :
                   "border-red-500/20 bg-red-500/10"
    )}>
      {/* Question */}
      <div className="mb-4 flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
          {index + 1}
        </span>
        <p className="text-sm font-medium leading-relaxed text-white/90">{question.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected  = selected === i;
          const isAnswer    = i === question.answer;
          const showCorrect = answered && isAnswer;
          const showWrong   = answered && isSelected && !isAnswer;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-all duration-150",
                !answered && "border-white/10 bg-white/5 text-white/70 hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-200 active:scale-[0.99]",
                showCorrect && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
                showWrong   && "border-red-400/40    bg-red-500/15    text-red-300",
                answered && !isSelected && !isAnswer && "border-white/5 bg-transparent text-white/20",
                "disabled:cursor-default focus:outline-none"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                !answered                    && "border-white/20 text-white/40",
                showCorrect                  && "border-emerald-400 bg-emerald-400/30 text-emerald-200",
                showWrong                    && "border-red-400    bg-red-400/30    text-red-200",
                answered && !isSelected && !isAnswer && "border-white/10 text-white/20"
              )}>
                {showCorrect ? "✓" : showWrong ? "✗" : OPTION_LETTERS[i]}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className={cn(
          "mt-4 rounded-lg p-3 text-xs leading-relaxed",
          isCorrect ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
        )}>
          <span className="font-semibold">{isCorrect ? "✅ Correct! " : "💡 Explanation: "}</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

export default function QuizSection({ data, onRetry, isRetrying }: QuizSectionProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span>🧪</span> Knowledge Quiz
        </h2>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
          {data.questions.length} questions
        </span>
      </div>

      <p className="text-xs text-white/30">Click an answer — your selection locks in immediately.</p>

      {/* Questions */}
      <div className="space-y-3">
        {data.questions.map((q, i) => <QuizCard key={i} question={q} index={i} />)}
      </div>

      {/* Retry */}
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5",
          "px-5 py-3 text-sm font-semibold text-white/60 transition-all duration-200",
          "hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-violet-300",
          "active:scale-[0.98] focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {isRetrying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
            Regenerating…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">🔄 New Quiz</span>
        )}
      </button>
    </div>
  );
}
