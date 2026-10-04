"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import {
  botGuardMessage,
  consumeFormToken,
  inspectFormSubmission,
  readBotFields,
  releaseFormToken,
} from "@/lib/bot-guard";

import { normalizeIdentifier } from "@/lib/identity";
import { getClientIp, getThrottleStatus } from "@/lib/login-throttle";
import { RegistrationError, registerCitizen } from "@/lib/services";
import { buildRegisterSchema, firstError, registerSchema } from "@/lib/validation";

function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}
import { userMessage } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/server";
import { auditNeutralizedInputs } from "@/lib/security";

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validation messages follow the language chosen by the arrival (F71).
  const t = getDictionary();

  // F81 — invisible bot controls run before any work: blocked attempts are
  // traced and replaying them never succeeds.
  const guard = await inspectFormSubmission({ form: "register", ...readBotFields(formData) });
  if (!guard.ok) return { ok: false, message: botGuardMessage(guard, t) };

  const schema = buildRegisterSchema(t.auth.register.errors);

  const parsed = schema.safeParse({
    name: formText(formData, "name"),
    email: formText(formData, "email"),
    username: formText(formData, "username"),
    password: formText(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  await auditNeutralizedInputs(
    { name: formData.get("name"), email: formData.get("email") },
    "inscription",
  );

  if (!(await consumeFormToken(guard.nonce, "register", guard.ip))) {
    return { ok: false, message: t.errors.botBlocked };
  }

  try {
    await registerCitizen({
      name: parsed.data.name,
      email: parsed.data.email || null,
      username: parsed.data.username || null,
      password: parsed.data.password,
    });
  } catch (error) {
    // Creation failed (duplicate email, DB…) — free the challenge so a
    // corrected retry works from the same page.
    await releaseFormToken(guard.nonce);
    // Only PublicError messages (e.g. "account already exists") are shown;
    // anything else maps to the generic copy — no technical details leak.
    return { ok: false, message: userMessage(error, t.errors.registerFailed) };
  }

  redirect("/login?inscription=1");
}

export type LoginThrottleState = { locked: boolean; retryAfterSeconds: number };

/**
 * Pre-login check used to give clear feedback before hitting NextAuth. It only
 * reads the throttle records (never the User table), so it cannot be used to
 * discover whether an account exists. Enforcement stays in `authorize`.
 */
export async function loginThrottleStatusAction(input: {
  identifier?: string;
}): Promise<LoginThrottleState> {
  const identifier = normalizeIdentifier(String(input?.identifier ?? ""));
  if (!identifier) return { locked: false, retryAfterSeconds: 0 };

  const status = await getThrottleStatus(identifier, getClientIp(headers()));
  return { locked: status.locked, retryAfterSeconds: status.retryAfterSeconds };
}
