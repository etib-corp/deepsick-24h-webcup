import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

/**
 * Lightweight entrance animation using CSS only (no JS, no anime.js), so it
 * costs nothing on low-powered devices and content is always visible if the
 * animation does not run. `motion-safe:` respects reduced-motion automatically.
 *
 * Extra props (`self`, `stagger`, `delay`, `y`) are accepted for call-site
 * compatibility but the effect is a single fade + rise of the container.
 */
export function Reveal({
  children,
  className,
  dataTour,
}: {
  children: ReactNode;
  className?: string;
  self?: boolean;
  stagger?: number;
  delay?: number;
  y?: number;
  dataTour?: string;
}) {
  return (
    <div
      data-tour={dataTour}
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
