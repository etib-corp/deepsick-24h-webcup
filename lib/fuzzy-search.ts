import {
  ORIENTATION_KEYWORDS,
  orientServices,
  stripQueryNoise,
  type OrientationMatch,
  type OrientationService,
} from "@/lib/orientation";

/**
 * D10 — "find the right service even when the request is worded badly".
 *
 * F92 (`orientServices`) already matches curated keywords and exact text
 * overlap. This layer adds **tolerance to imperfect wording**: misspellings,
 * missing accents, truncated words and plurals are matched with a bounded
 * edit distance, and both scores are merged so a distorted sentence still
 * leads to a relevant service.
 */

export type FuzzyMatch = {
  slug: string;
  name: string;
  category: string | null;
  score: number;
  /** Query words recognised thanks to fuzzy matching, shown as "why". */
  matchedTerms: string[];
};

export type GuidedMatch = OrientationMatch & {
  fuzzyTerms: string[];
  reason: "keywords" | "text" | "both";
};

/** Lower-case, accent-less form. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokenizeQuery(value: string, minLength = 3): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= minLength);
}

/** Levenshtein distance with an early exit once past `max`. */
function boundedDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

/** One edit for medium words, two for long ones; also accepts prefixes. */
export function termsSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  const max = Math.min(a.length, b.length) >= 8 ? 2 : 1;
  return boundedDistance(a, b, max) <= max;
}

const NAME_WEIGHTS = { exact: 4, prefix: 3, fuzzy: 2 } as const;

/** Scores one query token against a service; returns points + the hay word. */
function scoreToken(
  token: string,
  name: string[],
  category: string[],
  description: string[],
): { score: number; term: string | null } {
  let best = { score: 0, term: null as string | null };

  for (const word of name) {
    if (word === token) return { score: NAME_WEIGHTS.exact, term: word };
    if (word.startsWith(token) || token.startsWith(word)) {
      if (NAME_WEIGHTS.prefix > best.score) best = { score: NAME_WEIGHTS.prefix, term: word };
    } else if (termsSimilar(token, word) && NAME_WEIGHTS.fuzzy > best.score) {
      best = { score: NAME_WEIGHTS.fuzzy, term: word };
    }
  }
  if (best.score >= NAME_WEIGHTS.prefix) return best;

  for (const word of [...category, ...description]) {
    if (word === token) {
      if (2 > best.score) best = { score: 2, term: word };
    } else if (termsSimilar(token, word)) {
      if (1 > best.score) best = { score: 1, term: word };
    }
  }
  return best;
}

/**
 * Fuzzy-only search over a service catalogue: every query word that matches
 * (even imperfectly) adds points, weighted by where it matched. Deterministic
 * and explainable — each match lists the words it recognised.
 */
export function fuzzySearchServices(
  query: string,
  services: readonly OrientationService[],
  limit = 4,
): FuzzyMatch[] {
  const tokens = tokenizeQuery(stripQueryNoise(normalizeText(query)));
  if (tokens.length === 0) return [];

  const results = services.map((service) => {
    const name = tokenizeQuery(service.name, 2);
    const category = tokenizeQuery(service.category ?? "", 2);
    const description = tokenizeQuery(service.description, 4);

    let score = 0;
    const matchedTerms: string[] = [];
    for (const token of tokens) {
      const { score: points, term } = scoreToken(token, name, category, description);
      if (points > 0) {
        score += points;
        if (term && !matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }

    // Concept words from the orientation vocabulary (D10): "eclaiage" still
    // reaches the service whose keywords include "eclairage" even when the
    // word itself never appears in the catalogue text.
    for (const token of tokens) {
      for (const keyword of ORIENTATION_KEYWORDS[service.slug] ?? []) {
        if (token === keyword) {
          score += 3;
          if (!matchedTerms.includes(keyword)) matchedTerms.push(keyword);
          break;
        }
        if (termsSimilar(token, keyword)) {
          score += 2;
          if (!matchedTerms.includes(keyword)) matchedTerms.push(keyword);
          break;
        }
      }
    }

    return {
      slug: service.slug,
      name: service.name,
      category: service.category,
      score,
      matchedTerms: matchedTerms.slice(0, 4),
    };
  });

  return results
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * The search used by the "find a service" helper: curated keywords (F92) and
 * fuzzy text matching (D10) merged, so a badly worded request still lands on
 * the most relevant service. An empty array means "nothing close at all".
 */
export function guidedServiceSearch(
  query: string,
  services: readonly OrientationService[],
  limit = 4,
): GuidedMatch[] {
  const merged = new Map<string, GuidedMatch>();

  for (const match of orientServices(query, services, limit * 2)) {
    merged.set(match.slug, { ...match, fuzzyTerms: [], reason: "keywords" });
  }

  for (const match of fuzzySearchServices(query, services, limit * 2)) {
    const existing = merged.get(match.slug);
    if (existing) {
      existing.score += match.score;
      existing.fuzzyTerms = match.matchedTerms;
      existing.reason = "both";
    } else {
      merged.set(match.slug, {
        slug: match.slug,
        name: match.name,
        category: match.category,
        score: match.score,
        terms: [],
        fuzzyTerms: match.matchedTerms,
        reason: "text",
      });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
