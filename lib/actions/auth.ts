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
import { userMessage } from "@/lib/errors";
import { getDictionary } from "@/lib/i18n/server";
import { getClientIp, getThrottleStatus, normalizeEmail } from "@/lib/login-throttle";
import { auditNeutralizedInputs } from "@/lib/security";
import { registerCitizen } from "@/lib/services";
import { firstError, registerSchema } from "@/lib/validation";

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = getDictionary();

  // F81 — invisible bot controls run before any work: blocked attempts are
  // traced and replaying them never succeeds.
  const guard = await inspectFormSubmission({ form: "register", ...readBotFields(formData) });
  if (!guard.ok) return { ok: false, message: botGuardMessage(guard, t) };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
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
    await registerCitizen(parsed.data);
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
  email?: string;
}): Promise<LoginThrottleState> {
  const email = normalizeEmail(String(input?.email ?? "")).slice(0, 160);
  if (!email) return { locked: false, retryAfterSeconds: 0 };

  const status = await getThrottleStatus(email, getClientIp(headers()));
  return { locked: status.locked, retryAfterSeconds: status.retryAfterSeconds };
}
