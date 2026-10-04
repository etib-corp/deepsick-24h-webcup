"use server";

import { revalidatePath } from "next/cache";

import { requirePageRole } from "@/lib/permissions";
import { readId } from "@/lib/sanitize";
import { setRequestShared, toggleRequestSupport } from "@/lib/services";

/** F52 — community support for shared requests. */

export async function toggleSupportAction(formData: FormData) {
  const session = await requirePageRole(["CITIZEN"]);
  const requestId = readId(formData.get("requestId"));
  if (!requestId) return;

  try {
    await toggleRequestSupport(requestId, session.user.id);
  } catch {
    return;
  }

  revalidatePath("/citizen/soutien");
  revalidatePath("/citizen/requests");
  revalidatePath("/operations/administration");
}

export async function setRequestSharedAction(formData: FormData) {
  const session = await requirePageRole(["CITIZEN"]);
  const requestId = readId(formData.get("requestId"));
  const shared = formData.get("shared") === "true";
  if (!requestId) return;

  try {
    await setRequestShared(requestId, session.user.id, shared);
  } catch {
    return;
  }

  revalidatePath("/citizen/soutien");
}
