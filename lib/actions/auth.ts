"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { getClientIp, getThrottleStatus, normalizeEmail } from "@/lib/login-throttle";
import { registerCitizen } from "@/lib/services";
import { firstError, registerSchema } from "@/lib/validation";

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  try {
    await registerCitizen(parsed.data);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Inscription impossible.",
    };
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
  const email = normalizeEmail(String(input?.email ?? ""));
  if (!email) return { locked: false, retryAfterSeconds: 0 };

  const status = await getThrottleStatus(email, getClientIp(headers()));
  return { locked: status.locked, retryAfterSeconds: status.retryAfterSeconds };
}
