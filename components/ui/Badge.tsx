import type { ReactNode } from "react";

import { Badge as ShadcnBadge } from "@/components/shadcn/badge";
import { cn } from "@/lib/ui";

type Tone = "neutral" | "mars" | "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-border text-muted-foreground",
  mars: "border-primary/40 bg-primary/10 text-primary",
  info: "border-info/40 bg-info/10 text-info",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn("font-mono uppercase tracking-wide", TONES[tone], className)}
    >
      {children}
    </ShadcnBadge>
  );
}
