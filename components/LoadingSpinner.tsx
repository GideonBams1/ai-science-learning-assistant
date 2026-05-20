"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export default function LoadingSpinner({ size = "md", label, className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary-200 border-t-primary-600",
          sizeMap[size]
        )}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && (
        <p className="text-sm text-slate-500 animate-pulse">{label}</p>
      )}
    </div>
  );
}
