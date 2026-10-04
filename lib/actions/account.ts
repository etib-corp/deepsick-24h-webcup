"use server";

import { redirect } from "next/navigation";

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

  redirect("/api/auth/signout?callbackUrl=/login?deleted=1");
}
