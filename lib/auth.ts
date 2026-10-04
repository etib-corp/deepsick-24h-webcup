import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import {
  getClientIp,
  getThrottleStatus,
  normalizeEmail,
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
        email: { label: "Adresse e-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        // Bound attacker-controlled inputs before they reach the database.
        const email = normalizeEmail(credentials.email).slice(0, 160);
        const password = credentials.password.slice(0, 100);
        const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)
          ?.headers;
        const ip = getClientIp(headers);

        // Brute-force protection: refuse before touching the password.
        const throttle = await getThrottleStatus(email, ip);
        if (throttle.locked) {
          await recordSecurityEvent({
            type: "LOGIN_BLOCKED",
            outcome: "DENIED",
            detail: `Connexion bloquée · ${email}`,
            ip,
          });
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always run bcrypt (against a dummy hash when the user is missing) so
        // response timing does not reveal whether the account exists.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

        if (!user?.passwordHash || !valid) {
          await recordLoginFailure(email, ip);
          await recordSecurityEvent({
            type: "LOGIN_FAILED",
            outcome: "DENIED",
            detail: `Échec de connexion · ${email}`,
            ip,
          });
          return null;
        }

        await recordLoginSuccess(email);

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
