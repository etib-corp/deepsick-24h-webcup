import type { Prisma } from "@prisma/client";

/**
 * Colon identities (F71).
 *
 * New arrivals do not all have an email address, so an account can be created
 * with a "colon identifier" (a username) instead. Sign-in accepts either an
 * email or that identifier; both paths share the same normalisation, validation
 * and lookup rules so they cannot drift apart.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/**
 * Stored form used for lookup: trimmed, lowercase, accents stripped (new
 * arrivals may type their name with a keyboard that does not match the layout).
 */
export function normalizeIdentifier(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * A colon identifier starts with a letter, ends with a letter or a digit, and
 * may contain letters, digits, dots, dashes and underscores (3–30 characters).
 */
export function isValidUsername(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  if (normalized.length < USERNAME_MIN || normalized.length > USERNAME_MAX) return false;
  return /^[a-z][a-z0-9._-]*[a-z0-9]$/.test(normalized);
}

/**
 * Builds a candidate identifier from a full name, e.g. "Élodie Martin" →
 * "elodie.martin". Returns an empty string when nothing usable is left (the
 * resident then types their own identifier).
 */
export function suggestUsername(fullName: string): string {
  const candidate = normalizeIdentifier(fullName)
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, USERNAME_MAX)
    .replace(/[._-]+$/g, "");
  return isValidUsername(candidate) ? candidate : "";
}

/** Prisma filter matching either the email or the colon identifier. */
export function identifierWhere(identifier: string): Prisma.UserWhereInput {
  const id = normalizeIdentifier(identifier);
  return { OR: [{ email: id }, { username: id }] };
}
