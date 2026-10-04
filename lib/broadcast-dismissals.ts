/**
 * Council broadcast dismissals.
 *
 * Visitors can close a "Message du Haut Conseil" banner; the dismissed
 * broadcast ids live in `localStorage` under a **language-independent** key so
 * switching language (fr / en / es) never brings a closed message back — the
 * same helpers are unit-tested without a browser.
 */

export const DISMISSED_BROADCASTS_KEY = "nt-broadcast-dismissals";

/** Oldest ids are dropped beyond this cap so the stored list cannot grow forever. */
export const MAX_DISMISSED_BROADCASTS = 50;

/** Reads the raw localStorage value; unknown or broken data is ignored. */
export function parseDismissedBroadcasts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return normalize(data);
  } catch {
    return [];
  }
}

/** Serialises in dismissal order, keeping only the most recent ids. */
export function serializeDismissedBroadcasts(ids: readonly string[]): string {
  return JSON.stringify(normalize(ids));
}

/** Adds an id once; dismissing an already-closed message keeps the list unchanged. */
export function dismissBroadcast(ids: readonly string[], id: string): string[] {
  return normalize([...ids, id]);
}

function normalize(ids: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of ids) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (id === "" || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result.slice(-MAX_DISMISSED_BROADCASTS);
}
