import { z } from "zod";

import { USERNAME_MAX, isValidUsername } from "@/lib/identity";
import { OPINION_STANCES, PROJECT_STATUSES, REPORT_PRIORITIES, REPORT_TYPES, REQUEST_PRIORITIES } from "@/lib/roles";
import { sanitizePlainText, sanitizeUrl } from "@/lib/sanitize";

export type RegisterMessages = {
  name: string;
  identity: string;
  email: string;
  username: string;
  password: string;
};

/**
 * Register form validation (F71). Messages come from the active locale, and a
 * resident may register with an email **or** a colon identifier — not
 * necessarily both.
 */
export function buildRegisterSchema(messages: RegisterMessages) {
  return z
    .object({
      name: z.string().trim().min(2, messages.name).max(80),
      email: z
        .union([z.literal(""), z.string().trim().email(messages.email).max(160)])
        .optional(),
      username: z.string().trim().max(USERNAME_MAX).optional(),
      password: z.string().min(8, messages.password).max(100),
    })
    .superRefine((data, ctx) => {
      const email = data.email ?? "";
      const username = data.username ?? "";
      if (!email && !username) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.identity,
          path: ["username"],
        });
        return;
      }
      if (username && !isValidUsername(username)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.username,
          path: ["username"],
        });
      }
    });
}

/**
 * Bounded free text — trimmed and neutralised (markup and control characters
 * removed) before anything is stored. Legitimate French copy is untouched.
 */
export function plainText(min: number, minMessage: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, "Ce champ est trop long.")
    .transform((value) => sanitizePlainText(value).value)
    .pipe(z.string().min(min, minMessage));
}

/** Optional free text — same neutralisation, `undefined`/empty stays empty. */
export function optionalPlainText(max: number) {
  return z
    .string()
    .trim()
    .max(max, "Ce champ est trop long.")
    .transform((value) => sanitizePlainText(value).value)
    .optional();
}

export const registerSchema = z.object({
  name: plainText(2, "Indiquez votre nom complet.", 80),
  email: z.string().trim().email("Adresse e-mail invalide.").max(160),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(100),
});

export const contactSchema = z.object({
  subject: plainText(3, "Indiquez un objet.", 120),
  email: z.string().trim().email("Adresse e-mail invalide.").max(160),
  body: plainText(10, "Décrivez votre demande (10 caractères minimum).", 4000),
});

export const requestSchema = z.object({
  subject: plainText(3, "Indiquez un objet.", 120),
  description: plainText(10, "Décrivez votre demande (10 caractères minimum).", 4000),
  category: optionalPlainText(60),
  priority: z.enum(REQUEST_PRIORITIES),
});

/** Citizen incident (signalement) routed to a municipal service. */
export const reportSchema = z.object({
  type: z.enum(REPORT_TYPES),
  title: plainText(3, "Indiquez un objet.", 120),
  description: plainText(10, "Décrivez la situation (10 caractères min.).", 4000),
  priority: z.enum(REPORT_PRIORITIES),
  sector: optionalPlainText(80),
});

const optionalCoord = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : Number(value),
  z.number().min(0).max(1).optional(),
);

export const serviceSchema = z.object({
  name: plainText(3, "Indiquez un nom.", 120),
  description: plainText(10, "Décrivez le service.", 2000),
  category: optionalPlainText(60),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  mapX: optionalCoord,
  mapY: optionalCoord,
  sector: optionalPlainText(80),
  featured: z.coerce.boolean().optional(),
  // F74 — opening hours / location shown to residents.
  openingHours: optionalPlainText(80),
  address: optionalPlainText(160),
  // F89 — clear-language version of the essential information.
  plainLanguage: optionalPlainText(2000),
});

export const announcementSchema = z.object({
  title: plainText(3, "Indiquez un titre.", 160),
  excerpt: optionalPlainText(280),
  body: plainText(10, "Rédigez le contenu.", 8000),
  // F89 — clear-language version of the essential information.
  plainLanguage: optionalPlainText(8000),
  published: z.coerce.boolean().optional(),
});

/** F67 — city project published by the Council. */
export const projectSchema = z.object({
  title: plainText(3, "Indiquez un titre.", 160),
  summary: optionalPlainText(400),
  description: plainText(10, "Décrivez le projet.", 4000),
  sector: optionalPlainText(80),
  status: z.enum(PROJECT_STATUSES),
  progress: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : Number(value),
    z.number().int().min(0).max(100).optional(),
  ),
});

/** F68 — free improvement idea proposed by a resident. */
export const ideaSchema = z.object({
  title: plainText(3, "Indiquez un titre.", 160),
  body: plainText(10, "Décrivez votre idée.", 4000),
});

/** F76 — a resident's comment about a municipal service. */
export const feedbackSchema = z.object({
  comment: plainText(5, "Écrivez votre commentaire.", 1200),
});

/** F51 — a resident's concern about how their data is used. */
export const concernSchema = z.object({
  subject: plainText(3, "Indiquez le sujet de votre inquiétude.", 160),
  body: plainText(10, "Décrivez votre inquiétude.", 4000),
});

/** F84 — an agent's official reply on a citizen request. */
export const replySchema = z.object({
  body: plainText(3, "Rédigez la réponse.", 4000),
});

const optionalDateTime = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : new Date(String(value)),
  z.date().optional(),
);

/** Simulated police case attached from a security incident. */
export const policeCaseSchema = z.object({
  suspectName: optionalPlainText(120),
  arrestNotes: optionalPlainText(2000),
  pvContent: optionalPlainText(8000),
  fineAmount: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : Number(value),
    z
      .number()
      .int("Montant invalide.")
      .min(0, "Montant invalide.")
      .max(1_000_000, "Montant trop élevé.")
      .optional(),
  ),
});

export const broadcastSchema = z.object({
  title: plainText(3, "Indiquez un titre.", 160),
  message: plainText(10, "Rédigez le message.", 2000),
  actionLabel: optionalPlainText(60),
  // Only relative paths or http(s) URLs are stored — `javascript:` and
  // `data:` links are dropped before they can reach the banner.
  actionHref: z
    .string()
    .trim()
    .max(240)
    .transform((value) => sanitizeUrl(value).value)
    .optional(),
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  active: z.coerce.boolean().optional(),
});

export const consultationSchema = z.object({
  title: z.string().trim().min(3, "Indiquez un titre.").max(160),
  summary: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Décrivez le projet.").max(8000),
  published: z.coerce.boolean().optional(),
  anonymous: z.coerce.boolean().optional(),
  opensAt: optionalDateTime,
  closesAt: optionalDateTime,
});

/** Council-written, public outcome of a consultation (shown once closed). */
export const consultationOutcomeSchema = z.object({
  id: z.string().trim().min(1),
  outcome: z.string().trim().max(4000),
});

export const opinionSchema = z.object({
  consultationId: z.string().trim().min(1),
  stance: z.enum(OPINION_STANCES),
  comment: z.string().trim().min(10, "Exprimez votre avis (10 caractères min.).").max(2000),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}
