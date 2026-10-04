import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
import { auditActor, recordSecurityEvent } from "@/lib/security";

/** Thrown by `requireRole` when the session does not hold the expected role. */
export class PermissionError extends Error {
  constructor(public readonly role: string) {
    super(`Missing required role: ${role}`);
    this.name = "PermissionError";
  }
}

export function hasRole(session: Session | null, role: string): boolean {
  return session?.user?.role === role;
}

export function hasAnyRole(session: Session | null, roles: readonly string[]): boolean {
  const role = session?.user?.role;
  return typeof role === "string" && roles.includes(role);
}

export function requireRole(session: Session | null, role: string): Session {
  if (!hasRole(session, role)) throw new PermissionError(role);
  return session as Session;
}

/** Read the current session (server components / route handlers). */
export function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Guard a server component: redirects anonymous visitors to /login and
 * authorised-but-wrong-role users to their own dashboard. Every denial is
 * written to the security audit trail.
 */
export async function requirePageRole(roles: readonly string[]): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) {
    await recordSecurityEvent({
      type: "ACCESS_DENIED",
      outcome: "DENIED",
      detail: `page ${roles.join("/")} · visiteur anonyme`,
    });
    redirect("/login");
  }
  if (!hasAnyRole(session, roles)) {
    await recordSecurityEvent({
      type: "ACCESS_DENIED",
      outcome: "DENIED",
      ...auditActor(session),
      detail: `page ${roles.join("/")} · rôle ${session.user.role}`,
    });
    redirect(homeForRole(session.user.role));
  }
  return session;
}

export type ApiAuthResult =
  | { session: Session; error: null }
  | { session: null; error: "unauthorized" | "forbidden" };

/** Guard a route handler. Callers translate `error` into 401 / 403. */
export async function requireApiRole(roles: readonly string[]): Promise<ApiAuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    await recordSecurityEvent({
      type: "ACCESS_DENIED",
      outcome: "DENIED",
      detail: `api ${roles.join("/")} · requête anonyme`,
    });
    return { session: null, error: "unauthorized" };
  }
  if (!hasAnyRole(session, roles)) {
    await recordSecurityEvent({
      type: "ACCESS_DENIED",
      outcome: "DENIED",
      ...auditActor(session),
      detail: `api ${roles.join("/")} · rôle ${session.user.role}`,
    });
    return { session: null, error: "forbidden" };
  }
  return { session, error: null };
}
