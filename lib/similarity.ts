import { normalizeText } from "@/lib/fuzzy-search";

/**
 * F75 — "help agents spot requests about the same problem".
 *
 * Requests are compared on their meaningful words (subjects and descriptions,
 * accents and plurals normalised, boilerplate words ignored). The similarity
 * is a percentage of shared vocabulary, boosted when both requests sit in the
 * same category — deterministic, explainable, and it lists the shared words
 * so an agent can judge the match at a glance.
 */

export type SimilarityRequest = {
  id: string;
  subject: string;
  description: string;
  category: string | null;
};

export type SimilarityProfile = {
  id: string;
  tokens: Set<string>;
  category: string | null;
};

export type SimilarRequest = { id: string; score: number; terms: string[] };

/** Everyday words that carry no problem information. */
const STOP_WORDS = new Set([
  // French
  "les", "des", "une", "dans", "pour", "avec", "est", "sont", "mon", "mes",
  "son", "ses", "aux", "sur", "par", "elle", "nous", "vous", "ils", "que",
  "qui", "quoi", "plus", "pas", "cette", "ces", "suis", "mais", "tout",
  "tous", "tres", "bien", "fait", "faire", "depuis", "chez", "sans", "sous",
  "entre", "vers", "donc", "alors", "aussi", "comme", "etre", "avoir",
  "pouvez", "voulez", "voudrais", "aimerais", "besoin", "probleme",
  // English
  "the", "and", "for", "with", "this", "that", "from", "are", "was", "were",
  "have", "has", "had", "been", "would", "could", "should", "there", "their",
  "what", "when", "where", "which", "about", "into", "over", "very", "need",
  "please",
]);

/** Meaningful words of one text: normalised, deduplicated, plurals folded. */
export function similarityTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const raw of normalizeText(text).split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP_WORDS.has(raw)) continue;
    const token = raw.length > 4 && raw.endsWith("s") ? raw.slice(0, -1) : raw;
    if (token.length >= 3 && !STOP_WORDS.has(token)) tokens.add(token);
  }
  return tokens;
}

export function buildSimilarityProfile(request: SimilarityRequest): SimilarityProfile {
  return {
    id: request.id,
    category: request.category,
    tokens: similarityTokens(`${request.subject} ${request.description}`),
  };
}

export function similarityBetween(
  a: SimilarityProfile,
  b: SimilarityProfile,
): { score: number; terms: string[] } {
  if (a.tokens.size === 0 || b.tokens.size === 0) return { score: 0, terms: [] };

  const terms: string[] = [];
  for (const token of a.tokens) {
    if (b.tokens.has(token)) terms.push(token);
  }
  if (terms.length === 0) return { score: 0, terms: [] };

  const union = new Set([...a.tokens, ...b.tokens]);
  const jaccard = terms.length / union.size;
  const categoryBonus = a.category && a.category === b.category ? 10 : 0;
  return {
    score: Math.min(100, Math.round(jaccard * 100) + categoryBonus),
    terms: terms.sort(),
  };
}

/**
 * Requests most similar to `targetId`, best first. `threshold` keeps only
 * plausible duplicates; `limit` bounds the detail view list.
 */
export function findSimilarRequests(
  profiles: readonly SimilarityProfile[],
  targetId: string,
  { threshold = 30, limit = 5 }: { threshold?: number; limit?: number } = {},
): SimilarRequest[] {
  const target = profiles.find((profile) => profile.id === targetId);
  if (!target) return [];

  return profiles
    .filter((profile) => profile.id !== targetId)
    .map((profile) => {
      const { score, terms } = similarityBetween(target, profile);
      return { id: profile.id, score, terms };
    })
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** How many plausible duplicates each request has — used for list badges. */
export function similarCounts(
  profiles: readonly SimilarityProfile[],
  { threshold = 30 }: { threshold?: number } = {},
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    const similar = findSimilarRequests(profiles, profile.id, { threshold, limit: Number.MAX_SAFE_INTEGER });
    if (similar.length > 0) counts.set(profile.id, similar.length);
  }
  return counts;
}
