"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { normalizeIdentifier } from "@/lib/identity";
import { getClientIp, getThrottleStatus } from "@/lib/login-throttle";
import { RegistrationError, registerCitizen } from "@/lib/services";
import { buildRegisterSchema, firstError } from "@/lib/validation";

function formText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Validation messages follow the language chosen by the arrival (F71).
  const t = getDictionary();
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

  try {
    await registerCitizen({
      name: parsed.data.name,
      email: parsed.data.email || null,
      username: parsed.data.username || null,
      password: parsed.data.password,
    });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return {
        ok: false,
        message:
          error.code === "EMAIL_TAKEN"
            ? t.auth.register.errors.emailTaken
            : t.auth.register.errors.usernameTaken,
      };
    }
    return { ok: false, message: t.auth.register.errors.generic };
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
