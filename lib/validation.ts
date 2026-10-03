import { z } from "zod";

import { REPORT_PRIORITIES, REPORT_TYPES, REQUEST_PRIORITIES } from "@/lib/roles";
import { sanitizePlainText, sanitizeUrl } from "@/lib/sanitize";

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
});

export const announcementSchema = z.object({
  title: plainText(3, "Indiquez un titre.", 160),
  excerpt: optionalPlainText(280),
  body: plainText(10, "Rédigez le contenu.", 8000),
  published: z.coerce.boolean().optional(),
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

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}
