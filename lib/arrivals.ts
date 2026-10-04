/**
 * New-arrivals onboarding (F71).
 *
 * The checklist steps visited by a newcomer and the helpers keeping their
 * progress. Progress lives in `localStorage` under a **language-independent**
 * key, so switching language (fr / en / es) never resets it — and the same
 * helpers are unit-tested without a browser.
 */

export const ARRIVAL_PROGRESS_KEY = "nt-arrivals-progress";

export const ARRIVAL_STEP_IDS = ["account", "signin", "request", "help"] as const;

export type ArrivalStepId = (typeof ARRIVAL_STEP_IDS)[number];

export function isArrivalStepId(value: unknown): value is ArrivalStepId {
  return typeof value === "string" && (ARRIVAL_STEP_IDS as readonly string[]).includes(value);
}

/** Reads the raw localStorage value; unknown or broken data is ignored. */
export function parseProgress(raw: string | null | undefined): ArrivalStepId[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<ArrivalStepId>();
    for (const value of data) {
      if (isArrivalStepId(value)) seen.add(value);
    }
    return ARRIVAL_STEP_IDS.filter((id) => seen.has(id));
  } catch {
    return [];
  }
}

/** Serialises in the canonical step order (stable localStorage value). */
export function serializeProgress(ids: readonly ArrivalStepId[]): string {
  const seen = new Set<ArrivalStepId>();
  for (const id of ids) {
    if (isArrivalStepId(id)) seen.add(id);
  }
  return JSON.stringify(ARRIVAL_STEP_IDS.filter((id) => seen.has(id)));
}

export function toggleStep(ids: readonly ArrivalStepId[], id: ArrivalStepId): ArrivalStepId[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
