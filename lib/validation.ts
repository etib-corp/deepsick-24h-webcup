import { z } from "zod";

import { USERNAME_MAX, isValidUsername } from "@/lib/identity";
import { OPINION_STANCES, REQUEST_PRIORITIES } from "@/lib/roles";

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

export const contactSchema = z.object({
  subject: z.string().trim().min(3, "Indiquez un objet.").max(120),
  email: z.string().trim().email("Adresse e-mail invalide.").max(160),
  body: z
    .string()
    .trim()
    .min(10, "Décrivez votre demande (10 caractères minimum).")
    .max(4000),
});

export const requestSchema = z.object({
  subject: z.string().trim().min(3, "Indiquez un objet.").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Décrivez votre demande (10 caractères minimum).")
    .max(4000),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  priority: z.enum(REQUEST_PRIORITIES),
});

const optionalCoord = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : Number(value),
  z.number().min(0).max(1).optional(),
);

export const serviceSchema = z.object({
  name: z.string().trim().min(3, "Indiquez un nom.").max(120),
  description: z.string().trim().min(10, "Décrivez le service.").max(2000),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  icon: z.string().trim().max(8).optional().or(z.literal("")),
  mapX: optionalCoord,
  mapY: optionalCoord,
  sector: z.string().trim().max(80).optional().or(z.literal("")),
  featured: z.coerce.boolean().optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Indiquez un titre.").max(160),
  excerpt: z.string().trim().max(280).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Rédigez le contenu.").max(8000),
  published: z.coerce.boolean().optional(),
});

const optionalDateTime = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : new Date(String(value)),
  z.date().optional(),
);

export const broadcastSchema = z.object({
  title: z.string().trim().min(3, "Indiquez un titre.").max(160),
  message: z.string().trim().min(10, "Rédigez le message.").max(2000),
  actionLabel: z.string().trim().max(60).optional().or(z.literal("")),
  actionHref: z.string().trim().max(240).optional().or(z.literal("")),
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  active: z.coerce.boolean().optional(),
});

export const consultationSchema = z.object({
  title: z.string().trim().min(3, "Indiquez un titre.").max(160),
  summary: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Décrivez le projet.").max(8000),
  published: z.coerce.boolean().optional(),
  opensAt: optionalDateTime,
  closesAt: optionalDateTime,
});

export const opinionSchema = z.object({
  consultationId: z.string().trim().min(1),
  stance: z.enum(OPINION_STANCES),
  comment: z.string().trim().min(10, "Exprimez votre avis (10 caractères min.).").max(2000),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}
