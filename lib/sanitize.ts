/**
 * Input neutralisation — defence in depth, applied server-side before any
 * value is stored. React escapes everything it renders, so these helpers focus
 * on content a user should never need to submit: HTML/script markup, control
 * characters and links whose scheme would turn a stored URL into an attack
 * vector.
 *
 * They are deliberately conservative: accented French copy, apostrophes,
 * punctuation and line breaks must survive untouched.
 */

/** Complete tag-like sequences (`<script>…</script>`, `<img …>`). */
const TAG_LIKE = /<\/?[a-z][^<>]*>/i;
const TAG_LIKE_GLOBAL = /<\/?[a-z][^<>]*>/gi;

/** Attribute fragments that only make sense inside markup. */
const EVENT_ATTRIBUTE = /\son[a-z]+\s*=/i;

/** Control characters kept out of stored content (tabs/newlines stay). */
const CONTROL_CHAR = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const CONTROL_CHAR_GLOBAL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Whitespace browsers ignore inside a URL scheme (`java script:`). */
const URL_SCHEME_NOISE = /[\u0000-\u0020]+/g;

/** Schemes that execute code or smuggle payloads — never valid for stored links. */
const DANGEROUS_SCHEME = /\b(?:javascript|vbscript|data|file)\s*:/i;

/** Identifiers (cuid) accepted from forms before hitting the database. */
const ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;

export type SanitizeResult = {
  /** The safe value that may be stored and rendered. */
  value: string;
  /** True when something had to be removed (used for the audit trail). */
  neutralized: boolean;
};

/** Removes markup and control characters from a free-text value. */
export function sanitizePlainText(input: string): SanitizeResult {
  const cleaned = input
    .replace(CONTROL_CHAR_GLOBAL, "")
    .replace(TAG_LIKE_GLOBAL, "")
    .trim();
  return { value: cleaned, neutralized: cleaned !== input.trim() };
}

/**
 * True when the raw value contains content that would be neutralised: markup,
 * control characters, inline event handlers or an executable URL scheme.
 * Used to flag and record rejected payloads.
 */
export function hasDangerousContent(input: unknown): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  return (
    CONTROL_CHAR.test(input) ||
    TAG_LIKE.test(input) ||
    EVENT_ATTRIBUTE.test(input) ||
    DANGEROUS_SCHEME.test(input.replace(URL_SCHEME_NOISE, ""))
  );
}

/** Names of the fields (if any) whose raw value had to be neutralised. */
export function findDangerousFields(values: Record<string, unknown>): string[] {
  return Object.entries(values)
    .filter(([, value]) => hasDangerousContent(value))
    .map(([key]) => key);
}

/**
 * Accepts only links a banner can safely render: relative paths (`/services`)
 * or absolute `http(s)` URLs. Anything else — `javascript:`, `data:`,
 * protocol-relative `//host` — is dropped.
 */
export function sanitizeUrl(input: string | null | undefined): SanitizeResult {
  const raw = (input ?? "").trim();
  if (!raw) return { value: "", neutralized: false };

  const compact = raw.replace(URL_SCHEME_NOISE, "").toLowerCase();
  if (DANGEROUS_SCHEME.test(compact) || CONTROL_CHAR.test(raw)) {
    return { value: "", neutralized: true };
  }

  const isRelative = raw.startsWith("/") && !raw.startsWith("//");
  const isHttp = /^https?:\/\//i.test(raw);
  if (!isRelative && !isHttp) return { value: "", neutralized: true };

  return { value: raw, neutralized: false };
}

/** Sanitised, length-bounded text read from a form value (`undefined` when empty). */
export function readText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = sanitizePlainText(value).value.slice(0, maxLength).trim();
  return cleaned || undefined;
}

/** Validated record identifier read from a form value (empty string when invalid). */
export function readId(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  return ID_PATTERN.test(raw) ? raw : "";
}
