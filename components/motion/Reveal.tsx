"use client";

import { useRef, type ReactNode } from "react";

import { revealChildren, revealSelf, useMotionLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/ui";

/**
 * Client wrapper that fades its content in once it is mounted.
 *
 * - default — the **children** are staggered (grids of cards, lists of rows)
 * - `self` — the wrapper itself animates in (single blocks, hero rows)
 *
 * Server components can wrap their JSX with it: the children stay
 * server-rendered and are simply handed to this client boundary.
 */
export function Reveal({
  children,
  className,
  self = false,
  stagger = 70,
  delay = 0,
  y = 12,
  dataTour,
}: {
  children: ReactNode;
  className?: string;
  self?: boolean;
  /** Delay per child, in ms (ignored when `self` is set). */
  stagger?: number;
  delay?: number;
  /** Vertical distance the content travels from, in px. */
  y?: number;
  /** Optional `data-tour` hook so the interactive tutorial can spotlight it. */
  dataTour?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useMotionLayoutEffect(() => {
    const animation = self
      ? revealSelf(ref.current, { delay, y })
      : revealChildren(ref.current, { delay, step: stagger, y });

    return () => {
      animation?.revert();
    };
  }, [self, stagger, delay, y]);

  return (
    <div ref={ref} className={cn(className)} data-tour={dataTour}>
      {children}
    </div>
  );
}
