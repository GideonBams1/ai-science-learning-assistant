"use client";

import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";
import { DIFFICULTY_LABELS, DIFFICULTY_DESCRIPTIONS } from "@/types";

interface DifficultySelectorProps {
  value:     Difficulty;
  onChange:  (value: Difficulty) => void;
  disabled?: boolean;
}

const LEVELS: Difficulty[] = ["beginner", "intermediate", "advanced"];

const COLORS: Record<Difficulty, {
  active: string; border: string; icon: string; glow: string;
}> = {
  beginner:     { icon: "🌱", active: "bg-emerald-500/20 border-emerald-400/60 text-emerald-300", border: "border-white/10 text-white/50 hover:border-emerald-400/30 hover:text-emerald-300/70", glow: "shadow-emerald-500/20" },
  intermediate: { icon: "⚡", active: "bg-amber-500/20  border-amber-400/60  text-amber-300",   border: "border-white/10 text-white/50 hover:border-amber-400/30  hover:text-amber-300/70",  glow: "shadow-amber-500/20"  },
  advanced:     { icon: "🔬", active: "bg-violet-500/20 border-violet-400/60 text-violet-300",  border: "border-white/10 text-white/50 hover:border-violet-400/30 hover:text-violet-300/70", glow: "shadow-violet-500/20"  },
};

export default function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-widest text-white/40">
        Difficulty Level
      </label>
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => {
          const isActive = value === level;
          const c = COLORS[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center",
                "transition-all duration-200 focus:outline-none",
                "hover:scale-[1.02] active:scale-[0.98]",
                isActive ? cn(c.active, "shadow-lg", c.glow) : c.border,
                "bg-white/5 backdrop-blur-sm",
                disabled && "cursor-not-allowed opacity-50"
              )}
              aria-pressed={isActive}
            >
              <span className="text-xl leading-none">{c.icon}</span>
              <span className="text-xs font-semibold leading-tight">
                {DIFFICULTY_LABELS[level]}
              </span>
              <span className="hidden text-[10px] leading-tight opacity-60 sm:block">
                {DIFFICULTY_DESCRIPTIONS[level]}
              </span>
              {isActive && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
