/**
 * Interactive tutorial — the "guided tour" that runs over the real UI.
 *
 * A lesson is a list of steps. Each step spotlights one element of the page
 * (`data-tour` selector), dims and blocks everything else, and advances either
 * when you click the highlighted element or when you press *Next*.
 *
 * Only the mechanics live here — every word comes from `t.tour.lessons[id]`.
 */
import { getGuideProfile, type GuideProfileId } from "@/lib/guide";

export const TOUR_LESSON_IDS = ["PUBLIC", "CITIZEN", "CONSOLE", "COUNCIL"] as const;
export type TourLessonId = (typeof TOUR_LESSON_IDS)[number];

export type TourStep = {
  /** CSS selector of the element to spotlight. Omitted → centred card. */
  target?: string;
  /** Selector that must be clicked to advance (defaults to `target`). */
  click?: string;
  /** Page the step lives on; the tour navigates there when needed. */
  route?: string;
};

export type TourLesson = {
  id: TourLessonId;
  /** Page the lesson starts on. */
  route: string;
  icon: string;
  steps: TourStep[];
};

export const TOUR_LESSONS: Record<TourLessonId, TourLesson> = {
  PUBLIC: {
    id: "PUBLIC",
    route: "/",
    icon: "🧭",
    steps: [
      {},
      {
        target: '[data-tour="nav-services"], [data-tour="hero-services"]',
        click: '[data-tour="nav-services"], [data-tour="hero-services"]',
      },
      { target: '[data-tour="services-grid"]', route: "/services" },
      {
        target: '[data-tour="nav-guide"], [data-tour="footer-guide"]',
        click: '[data-tour="nav-guide"], [data-tour="footer-guide"]',
      },
      { target: '[data-tour="tour-launch"]', route: "/guide" },
    ],
  },
  CITIZEN: {
    id: "CITIZEN",
    route: "/citizen",
    icon: "🏠",
    steps: [
      {},
      { target: '[data-tour="console-nav"]' },
      { target: '[data-tour="citizen-stats"]' },
      {
        target: '[data-tour="console-nav"]',
        click: '[data-tour="console-nav"] a[href="/citizen/report"]',
      },
      { target: '[data-tour="report-type"]', route: "/citizen/report", click: '[data-tour="report-type"] input' },
      { target: '[data-tour="report-submit"]' },
    ],
  },
  CONSOLE: {
    id: "CONSOLE",
    route: "/operations/security",
    icon: "🛡️",
    steps: [
      {},
      { target: '[data-tour="incident-filters"]', click: '[data-tour="incident-filters"] button' },
      { target: '[data-tour="radar"]' },
      { target: '[data-tour="incident-feed"]', click: '[data-tour="incident-feed"] a' },
      { target: '[data-tour="assign"]', click: '[data-tour="assign"] button' },
      { target: '[data-tour="status-form"]' },
    ],
  },
  COUNCIL: {
    id: "COUNCIL",
    route: "/council",
    icon: "🛰️",
    steps: [
      {},
      { target: '[data-tour="council-stats"]' },
      {
        target: '[data-tour="console-nav"]',
        click: '[data-tour="console-nav"] a[href="/council/announcements"]',
      },
      { target: '[data-tour="announcement-form"]', route: "/council/announcements", click: "#title" },
      { target: '[data-tour="announcement-submit"]' },
    ],
  },
};

/** Where the tour stores its progress (survives the in-tour navigations). */
export const TOUR_STORAGE_KEY = "nt-tour";

/** Lesson that matches a guide profile — every profile has something to visit. */
export const TOUR_LESSON_FOR_PROFILE: Record<GuideProfileId, TourLessonId> = {
  VISITOR: "PUBLIC",
  CITIZEN: "CITIZEN",
  SECURITY: "CONSOLE",
  MEDIC: "CONSOLE",
  MAINTENANCE: "CONSOLE",
  DRIVER: "CONSOLE",
  MERCHANT: "CONSOLE",
  ADMIN_AGENT: "CONSOLE",
  COUNCIL: "COUNCIL",
};

/**
 * Representative profile for a lesson — used to tell which account a lesson
 * needs (the three incident consoles all run the CONSOLE lesson).
 */
export const PROFILE_FOR_LESSON: Record<TourLessonId, GuideProfileId> = {
  PUBLIC: "VISITOR",
  CITIZEN: "CITIZEN",
  CONSOLE: "SECURITY",
  COUNCIL: "COUNCIL",
};

export function getTourLesson(id: unknown): TourLesson | undefined {
  return TOUR_LESSON_IDS.includes(id as TourLessonId) ? TOUR_LESSONS[id as TourLessonId] : undefined;
}

/** Can this role start that lesson? Council reaches every console; anonymous only the public one. */
export function canStartLesson(role: string | null | undefined, id: TourLessonId): boolean {
  const profile = getGuideProfile(PROFILE_FOR_LESSON[id]);
  if (!profile.role) return true;
  return profile.role === role || role === "COUNCIL";
}

/** Lessons worth showing to that role — locked ones are left out entirely. */
export function accessibleLessons(role?: string | null): TourLessonId[] {
  return TOUR_LESSON_IDS.filter((id) => canStartLesson(role, id));
}

export function isTourLessonId(value: unknown): value is TourLessonId {
  return TOUR_LESSON_IDS.includes(value as TourLessonId);
}

/**
 * First element matching `selector` that actually has a box — the same selector
 * can exist twice (desktop and mobile navigation).
 */
export function findVisible(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    candidates.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null
  );
}
