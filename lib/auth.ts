import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { verifyAccessCode } from "@/lib/access-codes";
import { inspectFormSubmission } from "@/lib/bot-guard";
import { identifierWhere, normalizeIdentifier } from "@/lib/identity";
import { trackLoginDevice } from "@/lib/login-device";
import {
  getClientIp,
  getThrottleStatus,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security";

/** Compared against when the account does not exist, to keep timing uniform. */
const DUMMY_PASSWORD_HASH = "$2a$10$3WeFmNvl0NlOijPEqTeiF.Kd9P9M/H/pR1.nhhVeaT44SLIWBXFVS";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        // Email or colon identifier — new arrivals may not have an email (F71).
        identifier: { label: "Identifiant colon ou e-mail", type: "text" },
        password: { label: "Mot de passe", type: "password" },
        // D02 / F53 — one-time code (passwordless sign-in or second step).
        otp: { label: "Code à usage unique", type: "text" },
        otpMode: { label: "Mode", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier) return null;
        // A passwordless sign-in carries only a one-time code; the classic
        // flow always carries a password (D02 / F53).
        const extra = credentials as Record<string, string | undefined>;
        const passwordless = extra.otpMode === "passwordless";
        if (!passwordless && !credentials.password) return null;

        const identifier = normalizeIdentifier(credentials.identifier);
        const password = (credentials.password ?? "").slice(0, 100);
        const otp = (extra.otp ?? "").trim().slice(0, 12);
        const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)
          ?.headers;
        const ip = getClientIp(headers);
        const rawUserAgent = headers?.["user-agent"];
        const userAgent =
          (Array.isArray(rawUserAgent) ? rawUserAgent[0] : rawUserAgent)?.slice(0, 255) ?? null;

        // F81 — invisible bot controls before any credential work: a direct
        // POST without the signed challenge is refused and traced, and the
        // honeypot catches automated fillers. NextAuth types only
        // email/password, so the extra posted fields are read loosely.
        const guard = await inspectFormSubmission({
          form: "login",
          token: extra.botToken,
          trap: extra.botWebsite,
          ip,
        });
        if (!guard.ok) {
          throw new Error(guard.reason === "expired" ? "BOT_GUARD_EXPIRED" : "BOT_GUARD_BLOCKED");
        }

        // Brute-force protection: refuse before touching the password.
        const throttle = await getThrottleStatus(identifier, ip);
        if (throttle.locked) {
          await recordSecurityEvent({
            type: "LOGIN_BLOCKED",
            outcome: "DENIED",
            detail: `Connexion bloquée · ${identifier}`,
            ip,
          });
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findFirst({ where: identifierWhere(identifier) });

        if (passwordless) {
          // D02 — sign-in with a one-time code only. The code is verified
          // against its stored HMAC and consumed on success.
          const verdict = await verifyAccessCode(user?.id ?? null, "LOGIN", otp);
          if (!user || verdict !== "ok") {
            await recordLoginFailure(identifier, ip);
            await recordSecurityEvent({
              type: "ACCESS_CODE_DENIED",
              outcome: "DENIED",
              detail: `Code de connexion refusé · ${identifier} · ${verdict}`,
              ip,
            });
            return null;
          }
        } else {
          // Always run bcrypt (against a dummy hash when the user is missing)
          // so response timing does not reveal whether the account exists.
          const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

          if (!user || !user.passwordHash || !valid) {
            await recordLoginFailure(identifier, ip);
            await recordSecurityEvent({
              type: "LOGIN_FAILED",
              outcome: "DENIED",
              detail: `Échec de connexion · ${identifier}`,
              ip,
            });
            return null;
          }

          // F53 — two-step verification: with the option on, the password
          // alone never opens a session; a fresh one-time code is required.
          if (user.twoFactorEnabled) {
            if (!otp) {
              // The sign-in form catches this code and opens the code step,
              // where the resident can request the transmission.
              throw new Error("TWO_STEP_REQUIRED");
            }
            const verdict = await verifyAccessCode(user.id, "TWO_STEP", otp);
            if (verdict !== "ok") {
              await recordLoginFailure(identifier, ip);
              await recordSecurityEvent({
                type: "ACCESS_CODE_DENIED",
                outcome: "DENIED",
                detail: `Vérification en deux étapes refusée · ${identifier} · ${verdict}`,
                ip,
              });
              return null;
            }
          }
        }

        await recordLoginSuccess(identifier);

        // F54 — audit the successful login and warn the owner when the
        // (ip, user-agent) pair was never seen on this account before.
        await trackLoginDevice({ userId: user.id, role: user.role, ip, userAgent });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on sign-in.
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "CITIZEN";
      }
      return session;
    },
  },
};
