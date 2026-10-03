"use client";

import { Compass } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { useTour } from "@/components/tour/TourProvider";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import { getGuideProfile } from "@/lib/guide";
import {
  canStartLesson,
  PROFILE_FOR_LESSON,
  TOUR_LESSONS,
  TOUR_LESSON_IDS,
  type TourLessonId,
} from "@/lib/tour";
import { cn } from "@/lib/ui";

/** Buttons that launch the interactive tutorial, one per lesson. */
export function TourLauncher({
  lessons = TOUR_LESSON_IDS,
  role,
  onlyAccessible = false,
  className,
}: {
  lessons?: readonly TourLessonId[];
  /** Signed-in role, so a lesson the visitor cannot reach is flagged. */
  role?: string | null;
  /** Hide the lessons this role cannot start (instead of showing them locked). */
  onlyAccessible?: boolean;
  className?: string;
}) {
  const t = useT();
  const { start, active } = useTour();

  const visible = onlyAccessible
    ? lessons.filter((id) => canStartLesson(role, id))
    : lessons;

  if (visible.length === 0) return null;

  return (
    <div className={cn(className)} data-tour="tour-launch">
      <h2 className="flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-foreground">
        <Compass className="size-4 text-primary" />
        {t.tour.launchTitle}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.tour.launchHint}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t.tour.launchIntro}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((id) => {
          const lesson = TOUR_LESSONS[id];
          const profile = getGuideProfile(PROFILE_FOR_LESSON[id]);
          // Council can reach every console; anonymous visitors only the public one.
          const allowed =
            !profile.role || profile.role === role || role === "COUNCIL";

          return (
            <Card key={id} className="flex flex-col gap-2 p-4">
              <p className="flex items-center gap-2 font-mono text-sm text-foreground">
                <span aria-hidden>{lesson.icon}</span>
                {t.tour.lessons[id].label}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {lesson.route} · {lesson.steps.length}
              </p>
              {allowed ? null : (
                <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--info)]">
                  {format(t.tour.needsAccount, { account: profile.account ?? "" })}
                </p>
              )}
              <button
                type="button"
                onClick={() => start(id)}
                disabled={Boolean(active) || !allowed}
                className={buttonClasses("secondary", "sm", "mt-1 w-full")}
              >
                {t.tour.start}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
