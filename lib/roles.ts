// Central place for the enum-like values used across the app.
// SQLite does not support Prisma enums, so every value below is stored as a
// string and validated against these constants.

export const ROLES = [
  "CITIZEN",
  "SECURITY",
  "MEDIC",
  "MAINTENANCE",
  "DRIVER",
  "MERCHANT",
  "ADMIN_AGENT",
  "COUNCIL",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  CITIZEN: "Citoyen",
  SECURITY: "Sécurité",
  MEDIC: "Médical",
  MAINTENANCE: "Maintenance",
  DRIVER: "Transport",
  MERCHANT: "Commerce",
  ADMIN_AGENT: "Agent administratif",
  COUNCIL: "Haut Conseil",
};

/** Every role except the citizen — the professional console users. */
export const STAFF_ROLES: readonly Role[] = [
  "SECURITY",
  "MEDIC",
  "MAINTENANCE",
  "DRIVER",
  "MERCHANT",
  "ADMIN_AGENT",
  "COUNCIL",
];

/** In-world station name for each service, as used in the design. */
export const STATION_NAMES: Record<string, string> = {
  CITIZEN: "Résident",
  SECURITY: "Ares Security Command",
  MEDIC: "Asclepius Medical Net",
  MAINTENANCE: "Hephaestus Infrastructure",
  DRIVER: "Hermes Mobility Net",
  MERCHANT: "Mercator Exchange",
  ADMIN_AGENT: "Bureau des démarches",
  COUNCIL: "Haut Conseil de Nova Terra",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Landing page for a given role (also used by `middleware.ts`). */
export function homeForRole(role?: string | null): string {
  switch (role) {
    case "CITIZEN":
      return "/citizen";
    case "SECURITY":
      return "/operations/security";
    case "MEDIC":
      return "/operations/medical";
    case "MAINTENANCE":
      return "/operations/maintenance";
    case "DRIVER":
      return "/operations/transport";
    case "MERCHANT":
      return "/operations/commerce";
    case "ADMIN_AGENT":
      return "/operations/administration";
    case "COUNCIL":
      return "/council";
    default:
      return "/login";
  }
}

export const REQUEST_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  SUBMITTED: "Soumise",
  IN_REVIEW: "En cours d'examen",
  IN_PROGRESS: "En traitement",
  RESOLVED: "Résolue",
  CLOSED: "Clôturée",
};

/** Statuses that still require an agent action (drives the F22 filter). */
export const ACTIONABLE_STATUSES: readonly RequestStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "IN_PROGRESS",
];

export function needsAction(status: string): boolean {
  return (ACTIONABLE_STATUSES as readonly string[]).includes(status);
}

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}

export const REQUEST_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

export const REQUEST_PRIORITY_LABELS: Record<RequestPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  URGENT: "Urgente",
};

export const CONTACT_STATUSES = ["RECEIVED", "READ", "PROCESSED"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  RECEIVED: "Reçu",
  READ: "Lu",
  PROCESSED: "Traité",
};

export const REQUEST_CATEGORIES = [
  "Voirie",
  "Déchets",
  "Éclairage",
  "Espaces verts",
  "Transports",
  "État civil",
  "Autre",
] as const;

/* ------------------------------------------------------------------ *
 * Signalements (incidents) — the core engine of the ecosystem
 * ------------------------------------------------------------------ */

export const REPORT_TYPES = ["SECURITY", "MEDICAL", "MAINTENANCE", "CLEANLINESS"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  SECURITY: "Sécurité",
  MEDICAL: "Médical",
  MAINTENANCE: "Maintenance",
  CLEANLINESS: "Propreté",
};

/** Which service owns a given report type. */
export const REPORT_TYPE_ROLE: Record<ReportType, Role> = {
  SECURITY: "SECURITY",
  MEDICAL: "MEDIC",
  MAINTENANCE: "MAINTENANCE",
  CLEANLINESS: "MAINTENANCE",
};

export const REPORT_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "EN_ROUTE",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Ouvert",
  ASSIGNED: "Assigné",
  EN_ROUTE: "En route",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Clôturé",
};

/** Statuses that still require a service action. */
export const REPORT_ACTIONABLE: readonly ReportStatus[] = [
  "OPEN",
  "ASSIGNED",
  "EN_ROUTE",
  "IN_PROGRESS",
];

export function isReportType(value: unknown): value is ReportType {
  return typeof value === "string" && (REPORT_TYPES as readonly string[]).includes(value);
}

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value);
}

export const REPORT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;
export type ReportPriority = (typeof REPORT_PRIORITIES)[number];

export const REPORT_PRIORITY_LABELS: Record<ReportPriority, string> = {
  LOW: "Basse",
  NORMAL: "Normale",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export function isReportPriority(value: unknown): value is ReportPriority {
  return typeof value === "string" && (REPORT_PRIORITIES as readonly string[]).includes(value);
}

/** Sectors of the colony — used for report locations and the radar card. */
export const COLONY_SECTORS = [
  "Secteur 01 · Habitat",
  "Secteur 02 · BioDôme",
  "Secteur 03 · Planitia",
  "Secteur 04 · Rempart",
  "Secteur 05 · Industrie",
] as const;

/* ------------------------------------------------------------------ *
 * Commandes — taxi (Hermes) & restauration (Mercator)
 * ------------------------------------------------------------------ */

export const ORDER_TYPES = ["TAXI", "FOOD"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  TAXI: "Course",
  FOOD: "Restauration",
};

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "IN_TRANSIT",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  IN_TRANSIT: "En route",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ *
 * Rendez-vous (F40) — a resident books a slot with a municipal service
 * ------------------------------------------------------------------ */

export const APPOINTMENT_STATUSES = ["BOOKED", "CANCELLED", "COMPLETED"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  BOOKED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ *
 * Civic network — the services grid shown on the citizen dashboard
 * ------------------------------------------------------------------ */

export type CivicService = {
  key: string;
  label: string;
  href: string;
  icon: string;
  description: string;
};

export const CIVIC_SERVICES: readonly CivicService[] = [
  { key: "SECURITY", label: "Sécurité", href: "/services/securite", icon: "🛡️", description: "Signaler ou demander une escorte" },
  { key: "MEDICAL", label: "Médical", href: "/services/medical", icon: "✚", description: "Soins et accès d'urgence" },
  { key: "MAINTENANCE", label: "Maintenance", href: "/services/maintenance", icon: "🛠️", description: "Pannes et interventions techniques" },
  { key: "TRANSPORT", label: "Transport", href: "/services/transport", icon: "🚡", description: "Trajets et logistique" },
  { key: "COMMERCE", label: "Commerce", href: "/services/commerce", icon: "🍜", description: "Cantines et fournitures" },
  { key: "ADMINISTRATION", label: "Démarches", href: "/services/demarches", icon: "📄", description: "Permis et documents" },
  { key: "ANNOUNCEMENTS", label: "Annonces", href: "/announcements", icon: "📣", description: "Communications du Conseil" },
  { key: "MAP", label: "Carte", href: "/citizen/map", icon: "🗺️", description: "Modules et points d'intérêt" },
] as const;
