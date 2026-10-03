"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Lightbulb } from "lucide-react";

import { Reveal } from "@/components/motion/Reveal";
import { useTour } from "@/components/tour/TourProvider";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { GUIDE_PROFILES, getGuideProfile, type GuideProfileId } from "@/lib/guide";
import { TOUR_LESSON_FOR_PROFILE } from "@/lib/tour";
import { cn } from "@/lib/ui";

/**
 * Interactive walkthrough of the platform, one profile at a time.
 *
 * The prose lives in `t.guide`; this component only holds the structure
 * (which profile, where it works, which seeded account it uses).
 */
export function GuideExplorer({
  defaultProfile = "VISITOR",
  role,
}: {
  defaultProfile?: GuideProfileId;
  /** Signed-in role — a walkthrough for another role is flagged. */
  role?: string | null;
}) {
  const t = useT();
  const { start } = useTour();
  const [active, setActive] = useState<GuideProfileId>(defaultProfile);

  const profile = getGuideProfile(active);
  const copy = t.guide.profiles[active];
  // Council can reach every console; anonymous visitors only the public pages.
  const canVisit = !profile.role || profile.role === role || role === "COUNCIL";

  return (
    <div className="space-y-6">
      {/* Common ground — language, theme, sessions, refresh */}
      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-foreground">
          <BookOpen className="size-4 text-primary" />
          {t.guide.basicsTitle}
        </h2>
        <Reveal stagger={50} className="mt-4 grid gap-2 md:grid-cols-2">
          {t.guide.basics.map((item) => (
            <div key={item} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="text-primary">
                ▸
              </span>
              <span>{item}</span>
            </div>
          ))}
        </Reveal>
      </Card>

      {/* Profile picker */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t.guide.pickProfile}
        </p>
        <div className="flex flex-wrap gap-2">
          {GUIDE_PROFILES.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {t.guide.profiles[item.id].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected walkthrough — remounts on switch so the reveal replays */}
      <Card key={active} className="p-5">
        <header>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              {profile.icon}
            </span>
            <h2 className="font-mono text-lg text-foreground">{copy.label}</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.intro}</p>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.guide.whereTitle}
            </p>
            <p className="mt-1 truncate font-mono text-sm text-primary">{profile.href}</p>
            <Link
              href={profile.href}
              className={buttonClasses("secondary", "sm", "mt-2")}
            >
              {t.guide.openSpace}
              <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => start(TOUR_LESSON_FOR_PROFILE[active])}
              disabled={!canVisit}
              className={buttonClasses("primary", "sm", "mt-2 ml-2")}
            >
              {t.tour.start}
            </button>
            {canVisit ? null : (
              <span className="mt-2 ml-2 font-mono text-[10px] uppercase tracking-wide text-[var(--info)]">
                {format(t.tour.needsAccount, { account: profile.account ?? "" })}
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t.guide.accountTitle}
            </p>
            {profile.account ? (
              <>
                <p className="mt-1 truncate font-mono text-sm text-foreground">{profile.account}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.auth.demo.password}
                </p>
              </>
            ) : (
              <p className="mt-1 font-mono text-sm text-foreground">{t.guide.noAccount}</p>
            )}
          </div>
        </div>

        <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t.guide.stepsTitle}
        </h3>
        <ol className="mt-3 space-y-2">
          {copy.steps.map((step, index) => (
            <li key={step}>
              <Reveal self delay={index * 55} y={8}>
                <div className="flex gap-3 rounded-lg border border-border bg-card px-3 py-2">
                  <span className="shrink-0 font-mono text-xs text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <p className="mt-4 flex gap-2 rounded-lg border border-[var(--info)]/40 bg-[var(--info)]/10 p-3 text-sm text-muted-foreground">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--info)]" />
          <span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--info)]">
              {t.guide.tipTitle}
            </span>
            <br />
            {copy.tip}
          </span>
        </p>
      </Card>
    </div>
  );
}
