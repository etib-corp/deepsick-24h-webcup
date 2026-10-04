"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/format";
import {
  TOUR_STORAGE_KEY,
  findVisible,
  getTourLesson,
  type TourLessonId,
  type TourStep,
} from "@/lib/tour";
import { cn } from "@/lib/ui";

/** Local check — avoids pulling the anime.js-based motion module into the root bundle. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type TourState = { lesson: TourLessonId; step: number };

type TourApi = {
  active: TourState | null;
  start: (lesson: TourLessonId) => void;
  stop: () => void;
};

const TourContext = createContext<TourApi>({ active: null, start: () => {}, stop: () => {} });

/** Start / stop the interactive tutorial from anywhere. */
export function useTour(): TourApi {
  return useContext(TourContext);
}

const HOLE_PADDING = 6;
const TOOLTIP_WIDTH = 336;

/**
 * Interactive tutorial engine.
 *
 * It overlays the real UI with a dimmed backdrop cut around one `data-tour`
 * element: the hole lets clicks through to that element only, every other
 * interaction is blocked. Steps advance either when the highlighted element is
 * clicked (doing the real action) or with *Next*. Progress is kept in
 * `sessionStorage`, so a step can send the visitor to another page mid-tour.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<TourState | null>(null);
  const [step, setStep] = useState<TourStep | undefined>(undefined);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [nudged, setNudged] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  const nudgeTimer = useRef<number | undefined>(undefined);

  const lesson = state ? getTourLesson(state.lesson) : undefined;
  const total = lesson?.steps.length ?? 0;
  const copy = state ? t.tour.lessons[state.lesson]?.steps[state.step] : undefined;
  const needsClick = Boolean(step?.click);

  /* ----------------------------------------------------------------- state */

  const advance = useCallback((current: TourState | null): TourState | null => {
    if (!current) return null;
    const active = getTourLesson(current.lesson);
    if (!active) return null;
    const following = current.step + 1;
    return following >= active.steps.length ? null : { lesson: current.lesson, step: following };
  }, []);

  const next = useCallback(() => {
    setState((current) => advance(current));
  }, [advance]);

  const stop = useCallback(() => setState(null), []);

  const start = useCallback(
    (id: TourLessonId) => {
      const target = getTourLesson(id);
      setState({ lesson: id, step: 0 });
      if (target && pathname !== target.route) router.push(target.route);
    },
    [pathname, router],
  );

  // Resume inside the tab (the tour itself navigates between pages).
  useEffect(() => {
    const raw = window.sessionStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as TourState;
      if (getTourLesson(saved?.lesson) && Number.isInteger(saved?.step)) setState(saved);
    } catch {
      window.sessionStorage.removeItem(TOUR_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!state) {
      window.sessionStorage.removeItem(TOUR_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Keep the current step in a ref-free shape for the effects below.
  useEffect(() => {
    setStep(state ? lesson?.steps[state.step] : undefined);
  }, [state, lesson]);

  // Follow the page a step lives on — explicit `route`, else the lesson's own
  // page when the step has been target-less for a while (resuming a console
  // lesson on an unrelated page, for instance).
  useEffect(() => {
    if (!state || !lesson) return;
    const wanted = step?.route ?? lesson.route;
    if (pathname === wanted) return;
    if (step?.target && findVisible(step.target)) return;

    // Waiting matters: a step target can live on a dynamic route (an incident
    // detail), and bouncing too early would undo the visit.
    const timer = window.setTimeout(() => {
      if (pathname === wanted) return;
      if (step?.target && findVisible(step.target)) return;
      router.push(wanted);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [state, step, lesson, pathname, router]);

  /* ------------------------------------------------------------- measuring */

  useEffect(() => {
    if (!state) {
      setRect(null);
      return;
    }

    let frame = 0;

    const measure = () => {
      frame = 0;
      if (!step?.target) {
        setRect(null);
        return;
      }
      const element = findVisible(step.target);
      if (!element) return; // not painted yet — keep the previous box
      const next = element.getBoundingClientRect();
      setRect((current) =>
        current &&
        Math.abs(current.top - next.top) < 0.5 &&
        Math.abs(current.left - next.left) < 0.5 &&
        Math.abs(current.width - next.width) < 0.5 &&
        Math.abs(current.height - next.height) < 0.5
          ? current
          : next,
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    schedule();
    const interval = window.setInterval(schedule, 300);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [state, step, pathname]);

  // Bring the target into view once per step.
  useEffect(() => {
    if (!state || !step?.target) return;
    const element = findVisible(step.target);
    element?.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [state, step]);

  /* ---------------------------------------------------------- interactions */

  // Advance when the highlighted element is clicked (retry until it exists).
  useEffect(() => {
    const selector = step?.click ?? step?.target;
    if (!state || !selector) return;

    let element: HTMLElement | null = null;

    const onClick = () => {
      window.setTimeout(() => setState((current) => advance(current)), 140);
    };

    const attach = () => {
      const found = findVisible(selector);
      if (found === element) return Boolean(element);
      if (element) element.removeEventListener("click", onClick);
      element = found;
      if (element) element.addEventListener("click", onClick);
      return Boolean(element);
    };

    attach();
    const interval = window.setInterval(() => {
      if (attach()) window.clearInterval(interval);
    }, 250);

    return () => {
      window.clearInterval(interval);
      if (element) element.removeEventListener("click", onClick);
    };
  }, [state, step, advance]);

  // Escape leaves the tour.
  useEffect(() => {
    if (!state) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state, stop]);

  /* ---------------------------------------------------------------- render */

  const nudge = useCallback(() => {
    setNudged(true);
    window.clearTimeout(nudgeTimer.current);
    nudgeTimer.current = window.setTimeout(() => setNudged(false), 1200);

    if (ringRef.current && !prefersReducedMotion()) {
      // Web Animations API — native, no anime.js in the root bundle.
      ringRef.current.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 460, easing: "ease-in-out" },
      );
    }
  }, []);

  const hole = rect
    ? {
        top: rect.top - HOLE_PADDING,
        left: rect.left - HOLE_PADDING,
        right: rect.right + HOLE_PADDING,
        bottom: rect.bottom + HOLE_PADDING,
      }
    : null;

  const tooltipStyle: CSSProperties =
    hole && typeof window !== "undefined"
      ? (() => {
          const placeBelow = hole.bottom + 200 < window.innerHeight || hole.top < 200;
          const left = Math.min(
            Math.max(12, hole.left + (hole.right - hole.left) / 2 - TOOLTIP_WIDTH / 2),
            window.innerWidth - TOOLTIP_WIDTH - 12,
          );
          const top = placeBelow ? hole.bottom + 14 : Math.max(12, hole.top - 214);
          return { top, left, width: TOOLTIP_WIDTH };
        })()
      : { top: "50%", left: "50%", width: 384, transform: "translate(-50%, -50%)" };

  return (
    <TourContext.Provider value={{ active: state, start, stop }}>
      {children}

      {state && copy ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.tour.badge}
          className="pointer-events-none fixed inset-0 z-[100]"
        >
          {/* Everything except the hole is dimmed **and** swallows clicks. */}
          {hole ? (
            <>
              <div
                className="pointer-events-auto absolute inset-x-0 top-0 bg-black/70"
                style={{ height: Math.max(0, hole.top) }}
                onClick={nudge}
              />
              <div
                className="pointer-events-auto absolute inset-x-0 bottom-0 bg-black/70"
                style={{ top: hole.bottom }}
                onClick={nudge}
              />
              <div
                className="pointer-events-auto absolute bg-black/70"
                style={{
                  top: hole.top,
                  left: 0,
                  width: Math.max(0, hole.left),
                  height: Math.max(0, hole.bottom - hole.top),
                }}
                onClick={nudge}
              />
              <div
                className="pointer-events-auto absolute bg-black/70"
                style={{
                  top: hole.top,
                  left: hole.right,
                  right: 0,
                  height: Math.max(0, hole.bottom - hole.top),
                }}
                onClick={nudge}
              />
              <div
                ref={ringRef}
                className="pointer-events-none absolute rounded-xl ring-2 ring-primary"
                style={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.right - hole.left,
                  height: hole.bottom - hole.top,
                }}
              />
            </>
          ) : (
            <div className="pointer-events-auto absolute inset-0 bg-black/70" onClick={nudge} />
          )}

          {/* Instruction card */}
          <div
            key={`${state.lesson}-${state.step}`}
            style={tooltipStyle}
            className={cn(
              "pointer-events-auto absolute rounded-xl border bg-card p-4 shadow-2xl",
              nudged ? "border-destructive" : "border-primary/50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {t.tour.badge}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {format(t.tour.step, { current: state.step + 1, total })}
              </span>
            </div>

            <p aria-live="polite" className="mt-2 font-mono text-sm text-foreground">
              {copy.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>

            {nudged ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-destructive">
                {t.tour.blocked}
              </p>
            ) : null}

            {needsClick ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-primary">
                ▶ {t.tour.clickHint}
              </p>
            ) : null}

            {step?.target && !hole ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {t.tour.waiting}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={stop} className={buttonClasses("ghost", "sm")}>
                {t.tour.skip}
              </button>
              {needsClick ? null : (
                <button
                  type="button"
                  onClick={next}
                  autoFocus
                  className={buttonClasses("primary", "sm")}
                >
                  {state.step + 1 === total ? t.tour.finish : t.tour.next}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </TourContext.Provider>
  );
}
