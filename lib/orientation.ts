/**
 * F92 — deterministic orientation: match a free-text description of a problem
 * with the municipal services. No external AI dependency: recognised
 * expressions are curated per service, and text overlap with the service name,
 * category and description completes the score. Results stay explainable —
 * each match carries the words it recognised.
 */

export type OrientationService = {
  slug: string;
  name: string;
  category: string | null;
  description: string;
};

export type OrientationMatch = {
  slug: string;
  name: string;
  category: string | null;
  score: number;
  /** Recognised expressions, shown to the resident as "pourquoi ce service". */
  terms: string[];
};

/** Recognised expressions per service slug (accent-less, lower-case forms). */
const KEYWORDS: Record<string, readonly string[]> = {
  securite: [
    "securite",
    "vol",
    "cambriolage",
    "agression",
    "patrouille",
    "escorte",
    "police",
    "danger",
    "incident",
  ],
  medical: [
    "sante",
    "medecin",
    "docteur",
    "urgence",
    "vaccin",
    "pharmacie",
    "malade",
    "blesse",
    "hopital",
    "soin",
    "medical",
  ],
  maintenance: [
    "lampadaire",
    "eclairage",
    "voirie",
    "panne",
    "fuite",
    "eau",
    "recyclage",
    "trottoir",
    "dechets",
    "poubelle",
    "propre",
    "casse",
  ],
  transport: [
    "transport",
    "navette",
    "bus",
    "rover",
    "trajet",
    "deplacement",
    "mobilite",
    "fret",
    "colis",
    "livraison",
    "conduire",
  ],
  commerce: [
    "repas",
    "cantine",
    "nourriture",
    "restaurant",
    "commerce",
    "marche",
    "courses",
    "commander",
    "livraison",
  ],
  demarches: [
    "papier",
    "document",
    "attestation",
    "permis",
    "autorisation",
    "logement",
    "dossier",
    "administratif",
    "administration",
    "carte",
    "residence",
    "certificat",
  ],
};

/** Lower-case, accent-less form. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

/**
 * Returns the best-matching services for a description, most relevant first.
 * An empty array means "no clear match" — the UI then offers the full list
 * and the contact form.
 */
export function orientServices(
  query: string,
  services: readonly OrientationService[],
  limit = 3,
): OrientationMatch[] {
  const normalized = normalize(query);
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const matches = services.map((service) => {
    const name = normalize(service.name);
    const category = normalize(service.category ?? "");
    const description = normalize(service.description);

    let score = 0;
    const terms: string[] = [];

    for (const keyword of KEYWORDS[service.slug] ?? []) {
      if (normalized.includes(keyword)) {
        score += 3;
        terms.push(keyword);
      }
    }

    for (const token of tokens) {
      if (name.includes(token)) score += 4;
      if (category && category.includes(token)) score += 2;
      if (description.includes(token)) score += 2;
    }

    return {
      slug: service.slug,
      name: service.name,
      category: service.category,
      score,
      terms: terms.slice(0, 4),
    };
  });

  return matches
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}
