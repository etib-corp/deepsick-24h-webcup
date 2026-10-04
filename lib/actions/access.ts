"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { issueAccessCode, recentAccessCodeRequests } from "@/lib/access-codes";
import { botGuardMessage, inspectFormSubmission } from "@/lib/bot-guard";
import { format } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/server";
import { identifierWhere, normalizeIdentifier } from "@/lib/identity";
import { getClientIp, getThrottleStatus, recordLoginFailure } from "@/lib/login-throttle";
import { getAuthSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security";
import {
  ACCESS_CODE_MAX_REQUESTS,
  isTransmissionSimulation,
} from "@/lib/one-time-code";

/** Compared against when the account does not exist (uniform timing). */
const DUMMY_PASSWORD_HASH = "$2a$10$3WeFmNvl0NlOijPEqTeiF.Kd9P9M/H/pR1.nhhVeaT44SLIWBXFVS";

/**
 * D02 / F53 — server actions behind passwordless sign-in and the two-step
 * login. The code itself is issued here (or is a side effect of the sign-in
 * attempt); verification always happens in `authorize`, so a session can
 * never be opened without a valid, unconsumed code.
 */

export type AccessCodeResult =
  | { ok: true; simulated: boolean; code: string | null; expiresAtIso: string }
  | { ok: false; message: string };

type CodeRequestInput = {
  identifier?: string;
  botToken?: string;
  botWebsite?: string;
};

/** Shared front door: bot guard, throttle, account lookup, request rate. */
async function beginCodeRequest(
  input: CodeRequestInput,
  purpose: "LOGIN" | "TWO_STEP",
): Promise<
  | { ok: true; userId: string; actorRole: string; identifier: string; ip: string | null }
  | { ok: false; message: string }
> {
  const t = getDictionary();

  const guard = await inspectFormSubmission({
    form: "login",
    token: input.botToken,
    trap: input.botWebsite,
  });
  if (!guard.ok) return { ok: false, message: botGuardMessage(guard, t) };

  const identifier = normalizeIdentifier(String(input.identifier ?? ""));
  if (!identifier) return { ok: false, message: t.auth.login.identifierRequired };

  const ip = getClientIp(headers());
  const throttle = await getThrottleStatus(identifier, ip);
  if (throttle.locked) {
    return {
      ok: false,
      message: format(t.auth.login.tooManyAttempts, {
        minutes: Math.max(1, Math.ceil(throttle.retryAfterSeconds / 60)),
      }),
    };
  }

  const user = await prisma.user.findFirst({
    where: identifierWhere(identifier),
    select: { id: true, role: true, passwordHash: true, twoFactorEnabled: true },
  });
  if (!user) return { ok: false, message: t.auth.login.unknownAccount };

  if ((await recentAccessCodeRequests(user.id, purpose)) >= ACCESS_CODE_MAX_REQUESTS) {
    await recordSecurityEvent({
      type: "ACCESS_CODE_DENIED",
      outcome: "DENIED",
      actorId: user.id,
      actorRole: user.role,
      detail: `Demande de code trop fréquente · ${identifier}`,
      ip,
    });
    return { ok: false, message: t.auth.login.codeRateLimited };
  }

  return { ok: true, userId: user.id, actorRole: user.role, identifier, ip };
}

function codeResult(code: string, expiresAt: Date): AccessCodeResult {
  const simulated = isTransmissionSimulation();
  return {
    ok: true,
    simulated,
    code: simulated ? code : null,
    expiresAtIso: expiresAt.toISOString(),
  };
}

/**
 * D02 — passwordless sign-in: the resident asks for a one-time code on their
 * identifier. The code is stored hashed; the UI may show it as a simulated
 * "secure transmission" (`SIMULATED_TRANSMISSIONS=off` disables the display).
 */
export async function requestLoginCodeAction(
  input: CodeRequestInput,
): Promise<AccessCodeResult> {
  const begun = await beginCodeRequest(input, "LOGIN");
  if (!begun.ok) return begun;

  const { code, expiresAt } = await issueAccessCode(begun.userId, "LOGIN");
  await recordSecurityEvent({
    type: "ACCESS_CODE_ISSUED",
    outcome: "INFO",
    actorId: begun.userId,
    actorRole: begun.actorRole,
    detail: `Code de connexion émis · ${begun.identifier}`,
    ip: begun.ip,
  });
  return codeResult(code, expiresAt);
}

/**
 * F53 — second step of a two-step login. Reached after the password was
 * accepted (`TWO_STEP_REQUIRED`), so the password is re-verified here before
 * a fresh code is issued.
 */
export async function startTwoStepAction(
  input: CodeRequestInput & { password?: string },
): Promise<AccessCodeResult> {
  const begun = await beginCodeRequest(input, "TWO_STEP");
  if (!begun.ok) return begun;

  const t = getDictionary();
  const identifier = normalizeIdentifier(String(input.identifier ?? ""));
  const user = await prisma.user.findFirst({
    where: identifierWhere(identifier),
    select: { id: true, passwordHash: true, twoFactorEnabled: true },
  });

  const password = String(input.password ?? "").slice(0, 100);
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!user?.passwordHash || !valid || !user.twoFactorEnabled) {
    await recordLoginFailure(identifier, getClientIp(headers()));
    return { ok: false, message: t.auth.login.invalid };
  }

  const { code, expiresAt } = await issueAccessCode(user.id, "TWO_STEP");
  await recordSecurityEvent({
    type: "ACCESS_CODE_ISSUED",
    outcome: "INFO",
    actorId: user.id,
    actorRole: begun.actorRole,
    detail: `Code de vérification émis · ${identifier}`,
    ip: begun.ip,
  });
  return codeResult(code, expiresAt);
}

/** F53 — enable or disable two-step verification on one's own account. */
export async function setTwoFactorAction(
  enabled: boolean,
): Promise<{ ok: boolean; message: string }> {
  const t = getDictionary().citizen.account.twoFactor;
  const session = await getAuthSession();
  if (!session?.user?.id) return { ok: false, message: t.unauthorized };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: enabled },
  });
  await recordSecurityEvent({
    type: "TWO_FACTOR_CHANGED",
    outcome: "SUCCESS",
    actorId: session.user.id,
    actorRole: session.user.role,
    detail: `Vérification en deux étapes ${enabled ? "activée" : "désactivée"}`,
  });
  revalidatePath("/citizen/account");
  return { ok: true, message: enabled ? t.enabledMessage : t.disabledMessage };
}
