import {
  ACCESS_CODE_MAX_ATTEMPTS,
  ACCESS_CODE_REQUEST_WINDOW_MS,
  ACCESS_CODE_TTL_MS,
  accessCodeExpired,
  accessCodeMatches,
  accessCodeSecret,
  generateAccessCode,
  hashAccessCode,
  type AccessCodePurpose,
} from "@/lib/one-time-code";
import { prisma } from "@/lib/prisma";

/**
 * D02 / F53 — database flows around one-time access codes.
 *
 * `issueAccessCode` creates a fresh code (invalidating the previous live one
 * for the same purpose), `verifyAccessCode` consumes it exactly once and
 * counts wrong attempts. Every outcome is a plain verdict so callers can map
 * it to localized copy.
 */

export type AccessCodeVerdict = "ok" | "invalid" | "expired" | "locked";

export async function issueAccessCode(
  userId: string,
  purpose: AccessCodePurpose,
): Promise<{ code: string; expiresAt: Date }> {
  const now = new Date();
  const code = generateAccessCode();
  const expiresAt = new Date(now.getTime() + ACCESS_CODE_TTL_MS);

  // One live code per purpose: requesting a new one cancels the previous.
  await prisma.accessCode.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: now },
  });
  await prisma.accessCode.create({
    data: {
      userId,
      purpose,
      codeHash: hashAccessCode(code, accessCodeSecret()),
      expiresAt,
    },
  });

  // Opportunistic pruning — codes older than a day are never verifiable.
  try {
    await prisma.accessCode.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });
  } catch {
    // Best effort: the table only grows slowly.
  }

  return { code, expiresAt };
}

/** Codes requested for this account and purpose inside the rate window. */
export async function recentAccessCodeRequests(
  userId: string,
  purpose: AccessCodePurpose,
): Promise<number> {
  return prisma.accessCode.count({
    where: {
      userId,
      purpose,
      createdAt: { gte: new Date(Date.now() - ACCESS_CODE_REQUEST_WINDOW_MS) },
    },
  });
}

/**
 * Consumes the latest live code for the account/purpose.
 * `userId` may be null (unknown account) — the verdict is then "invalid".
 */
export async function verifyAccessCode(
  userId: string | null,
  purpose: AccessCodePurpose,
  code: string,
): Promise<AccessCodeVerdict> {
  if (!userId) return "invalid";

  const row = await prisma.accessCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return "invalid";

  if (accessCodeExpired(row.expiresAt)) {
    await prisma.accessCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
    return "expired";
  }

  if (!accessCodeMatches(code, row.codeHash, accessCodeSecret())) {
    const attempts = row.attempts + 1;
    const locked = attempts >= ACCESS_CODE_MAX_ATTEMPTS;
    await prisma.accessCode.update({
      where: { id: row.id },
      data: { attempts, consumedAt: locked ? new Date() : null },
    });
    return locked ? "locked" : "invalid";
  }

  await prisma.accessCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return "ok";
}
