"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuestionInputProps {
  value:     string;
  onChange:  (value: string) => void;
  onSubmit:  () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_QUESTIONS = [
  "How does photosynthesis work?",
  "What is quantum entanglement?",
  "Why does the sky appear blue?",
  "How do black holes form?",
  "What causes the Northern Lights?",
];

export default function QuestionInput({ value, onChange, onSubmit, isLoading, disabled }: QuestionInputProps) {
  const [focused, setFocused] = useState(false);
  const charLimit = 500;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim() && !isLoading) onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="question" className="block text-xs font-semibold uppercase tracking-widest text-white/40">
          Your Question
        </label>
        <span className={cn("text-xs transition-colors", value.length > charLimit * 0.9 ? "text-red-400" : "text-white/25")}>
          {value.length}/{charLimit}
        </span>
      </div>

      {/* Textarea */}
      <div className={cn(
        "relative rounded-xl border transition-all duration-200",
        focused ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-white/10",
        "bg-white/5 backdrop-blur-sm"
      )}>
        <textarea
          id="question"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, charLimit))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. How does DNA replication work? What causes gravity? Explain the Big Bang…"
          rows={4}
          disabled={disabled || isLoading}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3 text-sm text-white/90",
            "placeholder:text-white/25 focus:outline-none",
            "disabled:cursor-not-allowed"
          )}
        />
        <div className="absolute bottom-2 right-3 text-[10px] text-white/20 select-none">⌘↵ to ask</div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(q)}
            disabled={disabled || isLoading}
            className={cn(
              "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/40",
              "hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-blue-300",
              "transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl px-6 py-3.5 font-semibold text-sm",
          "bg-gradient-to-r from-blue-600 to-violet-600",
          "shadow-lg shadow-blue-500/25 transition-all duration-200",
          "hover:from-blue-500 hover:to-violet-500 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.01]",
          "active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100",
          "text-white"
        )}
      >
        {/* Shimmer layer */}
        <span className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating explanation…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🔭</span> Ask the Science Assistant
          </span>
        )}
      </button>
    </div>
  );
}
