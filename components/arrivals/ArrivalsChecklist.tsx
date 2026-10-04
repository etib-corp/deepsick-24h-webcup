"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, IdCard, KeyRound, LifeBuoy, RotateCcw } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ARRIVAL_PROGRESS_KEY,
  ARRIVAL_STEP_IDS,
  type ArrivalStepId,
  parseProgress,
  serializeProgress,
  toggleStep,
} from "@/lib/arrivals";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";

const STEP_ICONS: Record<ArrivalStepId, typeof IdCard> = {
  account: IdCard,
  signin: KeyRound,
  request: FileText,
  help: LifeBuoy,
};

const STEP_LINKS: Record<ArrivalStepId, string> = {
  account: "/register",
  signin: "/login",
  request: "/citizen",
  help: "/contact",
};

/**
 * The newcomer journey (F71): four steps, each with a pictogram so the page
 * stays understandable with little reading. Progress is stored on the device
 * and is **language-independent**: switching language never resets it.
 */
export function ArrivalsChecklist() {
  const t = useT();
  const [done, setDone] = useState<ArrivalStepId[]>([]);

  useEffect(() => {
    setDone(parseProgress(window.localStorage.getItem(ARRIVAL_PROGRESS_KEY)));
  }, []);

  function persist(next: ArrivalStepId[]) {
    setDone(next);
    window.localStorage.setItem(ARRIVAL_PROGRESS_KEY, serializeProgress(next));
  }

  function toggle(id: ArrivalStepId) {
    persist(toggleStep(done, id));
  }

  const completed = done.length;
  const total = ARRIVAL_STEP_IDS.length;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-mono text-lg text-foreground">{t.arrivals.stepsTitle}</h2>
        <p className="font-mono text-xs text-muted-foreground">
          {format(t.arrivals.progressLabel, { done: completed, total })}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t.arrivals.stepsHint}</p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{t.arrivals.progressSaved}</p>

      <ol className="mt-4 space-y-2">
        {ARRIVAL_STEP_IDS.map((id, index) => {
          const Icon = STEP_ICONS[id];
          const step = t.arrivals.steps[id];
          const checked = done.includes(id);
          return (
            <li
              key={id}
              className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 transition ${
                checked ? "border-primary/50 bg-primary/5" : "border-border"
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(id)}
                  aria-label={format(t.arrivals.markStep, { step: step.title })}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <Icon className="size-4 text-[var(--info)]" aria-hidden />
                  <span
                    aria-hidden
                    className="absolute -left-1 -top-1 flex size-4 items-center justify-center rounded-full bg-muted font-mono text-[9px] text-muted-foreground"
                  >
                    {index + 1}
                  </span>
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm text-foreground ${
                      checked ? "line-through decoration-primary/60" : ""
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{step.text}</span>
                </span>
              </label>
              <Link href={STEP_LINKS[id]} className={buttonClasses("secondary", "sm")}>
                {step.action}
              </Link>
            </li>
          );
        })}
      </ol>

      {completed > 0 ? (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => persist([])}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <RotateCcw className="size-3" aria-hidden />
            {t.arrivals.reset}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
