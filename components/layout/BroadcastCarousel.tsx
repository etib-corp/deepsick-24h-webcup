"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/ui";

export type BroadcastBannerItem = {
  id: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionHref: string | null;
};

const ROTATE_MS = 6000;

/** Rotates the active broadcasts instead of stacking them. */
export function BroadcastCarousel({ items }: { items: BroadcastBannerItem[] }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  const count = items.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reduced) return;
    const id = setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count, paused, reduced]);

  if (count === 0) return null;
  const active = items[index] ?? items[0];

  const goTo = (next: number) => setIndex(((next % count) + count) % count);
  const actionHref = active.actionHref;
  const actionLabel = active.actionLabel ?? t.broadcast.action;

  return (
    <div
      className="border-b border-amber-500/30 bg-amber-500/10"
      role="region"
      aria-roledescription="carousel"
      aria-label={t.broadcast.eyebrow}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          key={active.id}
          aria-live="polite"
          className="min-h-[3.5rem] min-w-0 flex-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-300">
            {t.broadcast.eyebrow}
          </p>
          <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{active.title}</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">
            {active.message}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actionHref ? (
            actionHref.startsWith("/") ? (
              <Link href={actionHref} className={buttonClasses("secondary", "sm", "shrink-0")}>
                {actionLabel}
              </Link>
            ) : (
              <a
                href={actionHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "sm", "shrink-0")}
              >
                {actionLabel}
              </a>
            )
          ) : null}

          {count > 1 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t.broadcast.previous}
                onClick={() => goTo(index - 1)}
                className={buttonClasses("ghost", "sm", "px-1.5")}
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1">
                {items.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={format(t.broadcast.goTo, { index: dotIndex + 1, total: count })}
                    aria-current={dotIndex === index}
                    onClick={() => goTo(dotIndex)}
                    className={cn(
                      "size-2 rounded-full transition",
                      dotIndex === index ? "bg-primary" : "bg-foreground/25 hover:bg-foreground/50",
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label={t.broadcast.next}
                onClick={() => goTo(index + 1)}
                className={buttonClasses("ghost", "sm", "px-1.5")}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
