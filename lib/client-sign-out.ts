import { signOut } from "next-auth/react";

/**
 * Client-side sign-out that returns to a path **on the current host**.
 *
 * NextAuth v4 resolves redirect URLs against `NEXTAUTH_URL` whenever it is set
 * (`next-auth/utils/detect-origin.js` returns it unconditionally), so
 * `signOut({ callbackUrl: "/" })` navigates to whatever host was baked into
 * the environment — on the deployed demo that was `http://localhost:3000`,
 * sending users to a dead page. Destroying the session with
 * `redirect: false` and navigating ourselves keeps the origin and port the
 * visitor is actually using, whatever the environment says.
 */
export async function signOutTo(path = "/"): Promise<void> {
  try {
    await signOut({ redirect: false });
  } finally {
    window.location.assign(path);
  }
}
