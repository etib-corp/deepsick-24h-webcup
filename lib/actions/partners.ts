"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { initialAdminActionState } from "@/lib/action-state";
import { slugify } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { labelToMinutes } from "@/lib/partners";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";

function text(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Builds a unique slug from the partner name. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name).slice(0, 80) || "partenaire";
  let candidate = base;
  let index = 2;
  while (await prisma.partner.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

/**
 * F99 — the Council publishes an external partner: description, optional
 * opening window (drives the "available now" status) and the next action a
 * resident can take.
 */
export async function createPartnerAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = getDictionary().partners;
  const session = await requirePageRole(["COUNCIL"]);

  const name = text(formData.get("name"), 160);
  const category = text(formData.get("category"), 80);
  const description = text(formData.get("description"), 4000);
  const contact = text(formData.get("contact"), 160);
  const actionLabel = text(formData.get("actionLabel"), 60);
  const actionHref = text(formData.get("actionHref"), 255);
  const opensAt = text(formData.get("opensAt"), 5);
  const closesAt = text(formData.get("closesAt"), 5);

  if (name.length < 3) return { ok: false, message: t.errors.name };
  if (description.length < 10) return { ok: false, message: t.errors.description };
  if (actionHref && !actionHref.startsWith("/") && !actionHref.startsWith("http")) {
    return { ok: false, message: t.errors.actionHref };
  }

  const openMinutes = opensAt ? labelToMinutes(opensAt) : null;
  const closeMinutes = closesAt ? labelToMinutes(closesAt) : null;
  if ((openMinutes === null) !== (closeMinutes === null)) {
    return { ok: false, message: t.errors.window };
  }

  await auditNeutralizedInputs(
    { name: formData.get("name"), description: formData.get("description") },
    "partenaire",
    session,
  );

  try {
    const partner = await prisma.partner.create({
      data: {
        slug: await uniqueSlug(name),
        name,
        category: category || null,
        description,
        contact: contact || null,
        actionLabel: actionLabel || null,
        actionHref: actionHref || null,
        openMinutes,
        closeMinutes,
        active: true,
      },
    });

    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "partner",
      targetId: partner.id,
      detail: `partenaire publié · ${name}`,
    });
  } catch {
    return { ok: false, message: getDictionary().errors.unexpected };
  }

  revalidatePath("/partenaires");
  revalidatePath("/council/partners");
  return { ...initialAdminActionState, ok: true, message: t.council.created };
}

/** Shows or hides a partner on the public directory. */
export async function togglePartnerAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));
  const active = String(formData.get("active") ?? "") === "1";

  try {
    await prisma.partner.update({ where: { id }, data: { active } });
    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "partner",
      targetId: id,
      detail: active ? "partenaire publié" : "partenaire masqué",
    });
  } catch {
    return;
  }

  revalidatePath("/partenaires");
  revalidatePath("/council/partners");
}

export async function deletePartnerAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));

  try {
    await prisma.partner.delete({ where: { id } });
    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "partner",
      targetId: id,
      detail: "partenaire supprimé",
    });
  } catch {
    return;
  }

  revalidatePath("/partenaires");
  revalidatePath("/council/partners");
}
