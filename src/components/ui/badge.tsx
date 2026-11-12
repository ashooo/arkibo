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
      "bg-secondary-soft text-emerald-800 border-emerald-200",
    warning:
      "bg-tertiary-soft text-amber-900 border-amber-200",
    error:
      "bg-error-soft text-red-900 border-red-200",
    primary:
      "bg-primary-soft text-primary-dark border-blue-200",
    neutral:
      "bg-slate-100 text-slate-700 border-slate-200",
    outline:
      "bg-transparent text-slate-body border-slate-border",
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

