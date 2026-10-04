import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { inspectFormSubmission } from "@/lib/bot-guard";
import { identifierWhere, normalizeIdentifier } from "@/lib/identity";
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
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials.password) return null;

        const identifier = normalizeIdentifier(credentials.identifier);
        const password = credentials.password.slice(0, 100);
        const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)
          ?.headers;
        const ip = getClientIp(headers);

        // F81 — invisible bot controls before any credential work: a direct
        // POST without the signed challenge is refused and traced, and the
        // honeypot catches automated fillers. NextAuth types only
        // email/password, so the extra posted fields are read loosely.
        const extra = credentials as Record<string, string | undefined>;
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

        // Always run bcrypt (against a dummy hash when the user is missing) so
        // response timing does not reveal whether the account exists.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

        if (!user?.passwordHash || !valid) {
          await recordLoginFailure(identifier, ip);
          await recordSecurityEvent({
            type: "LOGIN_FAILED",
            outcome: "DENIED",
            detail: `Échec de connexion · ${identifier}`,
            ip,
          });
          return null;
        }

        await recordLoginSuccess(identifier);

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
