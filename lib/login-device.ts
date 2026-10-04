import "server-only";

import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security";
import { pushNotification } from "@/lib/services";

/** How many previous successful logins are compared to decide "known device". */
const KNOWN_DEVICE_SAMPLE = 50;

/** True when this (ip, user-agent) pair was never seen on a successful login. */
async function isNewDevice(
  userId: string,
  ip: string | null,
  userAgent: string | null,
): Promise<boolean> {
  const previous = await prisma.securityEvent.findMany({
    where: { actorId: userId, type: "LOGIN_SUCCESS" },
    orderBy: { createdAt: "desc" },
    take: KNOWN_DEVICE_SAMPLE,
    select: { ip: true, userAgent: true },
  });
  return !previous.some((event) => event.ip === ip && event.userAgent === userAgent);
}

/**
 * F54 — records a successful sign-in. When the account is used from an
 * unknown device (pair of IP + user-agent never seen before), the owner is
 * warned through their notification feed so they can react immediately.
 * Never throws: tracking must not block a valid sign-in.
 */
export async function trackLoginDevice(params: {
  userId: string;
  role: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  const { userId, role, ip, userAgent } = params;
  try {
    const known = await isNewDevice(userId, ip, userAgent);

    if (!known && role === "CITIZEN") {
      await pushNotification(userId, {
        title: "Nouvelle connexion détectée",
        body:
          "Votre compte vient d'être utilisé depuis un nouvel appareil. Si vous êtes à l'origine de cette connexion, ignorez ce message. Sinon, contactez sans délai l'administration de la colonie.",
        href: "/citizen/notifications",
      });
    }

    await recordSecurityEvent({
      type: "LOGIN_SUCCESS",
      outcome: "SUCCESS",
      actorId: userId,
      actorRole: role,
      ip,
      userAgent,
      detail: known ? "Connexion réussie" : "Connexion réussie · nouvel appareil",
    });
  } catch {
    // The sign-in itself already succeeded; device tracking is best-effort.
  }
}
