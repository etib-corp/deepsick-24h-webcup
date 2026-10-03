/**
 * Error hygiene — security failures must never leak technical details
 * (stack traces, SQL fragments, driver errors) to the user.
 *
 * Only `PublicError` messages are safe to display; anything else is mapped to
 * the caller's generic fallback.
 */
export class PublicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicError";
  }
}

/** Message to show a user: the `PublicError` copy, or the generic fallback. */
export function userMessage(error: unknown, fallback: string): string {
  return error instanceof PublicError ? error.message : fallback;
}
