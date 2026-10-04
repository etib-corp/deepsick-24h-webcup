/** Shared, client-safe vocabulary for the developer ticket panel. */

export const TICKET_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "DONE"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  BLOCKED: "Bloqué",
  REVIEW: "À revoir",
  DONE: "Terminé",
};

export type TicketTone = "neutral" | "info" | "danger" | "warning" | "success";

export const TICKET_STATUS_TONES: Record<TicketStatus, TicketTone> = {
  TODO: "neutral",
  IN_PROGRESS: "info",
  BLOCKED: "danger",
  REVIEW: "warning",
  DONE: "success",
};

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === "string" && (TICKET_STATUSES as readonly string[]).includes(value);
}

/** Difficulty tiers used by the Webcup API, ordered. */
export const DIFFICULTY_ORDER: Record<string, number> = {
  Facile: 1,
  Moyenne: 2,
  Difficile: 3,
  Expert: 4,
};

export const DIFFICULTIES = ["Facile", "Moyenne", "Difficile", "Expert"] as const;

export type DifficultyTone = "success" | "info" | "warning" | "danger";

export const DIFFICULTY_TONES: Record<string, DifficultyTone> = {
  Facile: "success",
  Moyenne: "info",
  Difficile: "warning",
  Expert: "danger",
};

/**
 * Short French titles for the known need codes — mirrors SUMMARY_KEYWORDS in
 * scripts/fetch_new_features.py so the panel and the generated TODO agree.
 */
export const TICKET_TITLES: Record<string, string> = {
  D01: "Inscription / création de compte habitant",
  D03: "Connexion + espace personnel",
  D04: "Contact administration (formulaire + accusé)",
  D05: "Présentation des services municipaux",
  D06: "Publications / annonces municipales",
  D07: "Page d'accueil claire et hiérarchisée",
  D08: "Rôles : citoyen / agent / admin",
  D09: "Permissions / accès différenciés",
  D19: "Espace agents avec vue sur les données API",
  F22: "Vue des demandes habitants avec états",
  F71: "Nouveaux arrivants : accès sans e-mail et multilingue",
};

export function ticketTitle(code: string, message: string): string {
  if (TICKET_TITLES[code]) return TICKET_TITLES[code];
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
}
