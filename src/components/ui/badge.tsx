import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "error" | "primary" | "neutral" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  const variants = {
    success:
      "bg-secondary-soft dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80",
    warning:
      "bg-tertiary-soft dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800/80",
    error:
      "bg-error-soft dark:bg-red-950/60 text-red-900 dark:text-red-300 border-red-200 dark:border-red-800/80",
    primary:
      "bg-primary-soft dark:bg-dark-accentSurface text-primary-dark dark:text-dark-accent border-blue-200 dark:border-dark-accentBorder",
    neutral:
      "bg-slate-100 dark:bg-dark-cardAlt text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border",
    outline:
      "bg-transparent text-slate-600 dark:text-slate-400 border-slate-border dark:border-dark-border",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border transition-colors select-none font-sans",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
