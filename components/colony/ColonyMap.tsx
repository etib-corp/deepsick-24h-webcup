"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/ui";

export type ColonyMapNode = {
  id: string;
  label: string;
  icon?: string | null;
  sector?: string | null;
  description?: string;
  featured?: boolean;
  x: number;
  y: number;
  href: string;
};

/**
 * Interactive plan of Terra Nova. The illustrated artwork is used as the base
 * layer; transparent, keyboard-focusable hotspots sit on the drawn pins and
 * reveal a detail panel on hover/focus.
 */
export function ColonyMap({
  nodes,
  label,
  hint,
  ctaLabel,
  className,
}: {
  nodes: ColonyMapNode[];
  label: string;
  hint?: string;
  ctaLabel: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = nodes.find((node) => node.id === activeId) ?? null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-[1236/948] w-full overflow-hidden rounded-xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/terra-nova-map.webp"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover select-none"
        />

        {/* Subtle vignette to blend the artwork with the theme */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 50%, transparent 55%, color-mix(in oklch, var(--background) 55%, transparent) 100%)",
          }}
        />

        {nodes.map((node) => {
          const isActive = node.id === activeId;
          return (
            <Link
              key={node.id}
              href={node.href}
              aria-label={node.label}
              className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus:outline-none"
              style={{ left: `${(node.x * 100).toFixed(2)}%`, top: `${(node.y * 100).toFixed(2)}%` }}
              onMouseEnter={() => setActiveId(node.id)}
              onMouseLeave={() => setActiveId((current) => (current === node.id ? null : current))}
              onFocus={() => setActiveId(node.id)}
              onBlur={() => setActiveId((current) => (current === node.id ? null : current))}
            >
              <span
                className={cn(
                  "absolute size-11 rounded-full border-2 transition",
                  isActive
                    ? "border-primary opacity-100 motion-safe:animate-pulse"
                    : "border-transparent opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute size-3 rounded-full bg-primary transition",
                  isActive ? "scale-100 opacity-100" : "scale-0 opacity-0",
                )}
              />
              {node.featured ? (
                <span className="absolute size-2 rounded-full border border-primary bg-primary/80" />
              ) : null}
              <span className="sr-only">{node.label}</span>
            </Link>
          );
        })}

        {/* Corner ticks */}
        <span className="pointer-events-none absolute left-2 top-2 font-mono text-[10px] text-primary/70">
          +
        </span>
        <span className="pointer-events-none absolute right-2 top-2 font-mono text-[10px] text-primary/70">
          +
        </span>
        <span className="pointer-events-none absolute bottom-2 right-2 font-mono text-[10px] text-primary/70">
          +
        </span>
      </div>
      {/* Detail panel */}
      <div
        className="relative"
        aria-live="polite"
      >
        {active ? (
          <div className="pointer-events-auto rounded-lg border border-primary/40 bg-background/95 p-3 shadow-lg backdrop-blur">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {active.sector}
            </p>
            <p className="mt-0.5 flex items-center gap-2 font-mono text-sm text-foreground">
              <span aria-hidden>{active.icon ?? "•"}</span>
              {active.label}
            </p>
            {active.description ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {active.description}
              </p>
            ) : null}
            <Link
              href={active.href}
              className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-primary hover:underline"
            >
              {ctaLabel}
              <ArrowRight className="size-3" />
            </Link>
          </div>
        ) : (
          <p className="rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            {hint ?? label}
          </p>
        )}
      </div>

    </div>
  );
}
