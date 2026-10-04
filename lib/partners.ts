/**
 * F99 — external partners offering services through the city platform.
 *
 * Each partner has an opening window (minutes since midnight, optional) and
 * an optional next action. The availability is computed from the window, so
 * a resident immediately sees what is **available now**, what is **not**,
 * and what to do next. Pure and deterministic, unit-tested without a clock.
 */

export type PartnerWindow = {
  openMinutes: number | null;
  closeMinutes: number | null;
};

export type PartnerAvailability = {
  /** True when the partner is reachable right now. */
  open: boolean;
  /** "HH:MM" of the opening time, when defined. */
  opensAt: string | null;
  /** "HH:MM" of the closing time, when defined. */
  closesAt: string | null;
};

export function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const rest = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${rest}`;
}

/** Parses an `<input type="time">` value ("HH:MM") to minutes since midnight. */
export function labelToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function partnerAvailability(
  window: PartnerWindow,
  now: Date = new Date(),
): PartnerAvailability {
  const { openMinutes, closeMinutes } = window;

  // No window configured: the partner is permanently reachable.
  if (openMinutes === null || closeMinutes === null) {
    return { open: true, opensAt: null, closesAt: null };
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const overnight = closeMinutes <= openMinutes;
  const open = overnight
    ? nowMinutes >= openMinutes || nowMinutes < closeMinutes
    : nowMinutes >= openMinutes && nowMinutes < closeMinutes;

  return {
    open,
    opensAt: minutesToLabel(openMinutes),
    closesAt: minutesToLabel(closeMinutes),
  };
}
