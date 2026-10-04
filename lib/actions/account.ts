"use server";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { deleteAccount } from "@/lib/services";

export async function deleteAccountAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = getDictionary().citizen.account;

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { ok: false, message: t.unauthorized };
  }
  // Only citizens may self-delete; the id always comes from the session,
  // never from the request, so another account can't be targeted.
  if (session.user.role !== "CITIZEN") {
    return { ok: false, message: t.forbidden };
  }
  if (String(formData.get("confirm") ?? "").trim() !== t.confirmPhrase) {
    return { ok: false, message: t.confirmMismatch };
  }

  try {
    await deleteAccount(session.user.id);
  } catch {
    return { ok: false, message: t.failed };
  }

  // Success is reported to the client, which clears the session on the current
  // host and lands on `/login?deleted=1` (see DeleteAccountForm /
  // lib/client-sign-out.ts). A server redirect through the NextAuth signout
  // endpoint would resolve against NEXTAUTH_URL and could send the visitor to
  // another host (e.g. localhost on a deployed instance).
  return { ok: true };
}
