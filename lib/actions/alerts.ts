"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { initialAdminActionState } from "@/lib/action-state";
import { isAlertSeverity } from "@/lib/alerts";
import { getCitizensForSector } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";

function text(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * F101 — the High Council informs residents without delay: publishing an
 * alert makes it visible immediately (banner + /alertes page) and pushes a
 * notification to the citizens of the concerned sector (all citizens when no
 * sector is targeted).
 */
export async function createColonyAlertAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = getDictionary().alerts;
  const session = await requirePageRole(["COUNCIL"]);

  const title = text(formData.get("title"), 160);
  const severity = text(formData.get("severity"), 12);
  const sector = text(formData.get("sector"), 80);
  const situation = text(formData.get("situation"), 4000);
  const instructions = text(formData.get("instructions"), 4000);

  if (title.length < 3) return { ok: false, message: t.errors.title };
  if (!isAlertSeverity(severity)) return { ok: false, message: t.errors.severity };
  if (situation.length < 10) return { ok: false, message: t.errors.situation };
  if (instructions.length < 5) return { ok: false, message: t.errors.instructions };

  await auditNeutralizedInputs(
    { title: formData.get("title"), situation: formData.get("situation") },
    "alerte colonie",
    session,
  );

  try {
    const alert = await prisma.colonyAlert.create({
      data: {
        title,
        severity,
        sector: sector || null,
        situation,
        instructions,
        startsAt: new Date(),
        status: "ACTIVE",
        authorId: session.user.id,
      },
    });

    // "Informés sans délai": the residents of the sector get a push right away.
    const citizens = await getCitizensForSector(alert.sector);
    if (citizens.length > 0) {
      await prisma.notification.createMany({
        data: citizens.map((citizen) => ({
          userId: citizen.id,
          title: `🚨 ${title}`,
          body: situation.slice(0, 300),
          href: "/alertes",
        })),
      });
    }

    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "colony-alert",
      targetId: alert.id,
      detail: `alerte publiée · ${severity} · ${sector || "toute la colonie"}`,
    });
  } catch {
    return { ok: false, message: getDictionary().errors.unexpected };
  }

  revalidatePath("/alertes");
  revalidatePath("/council/alerts");
  revalidatePath("/");
  return { ...initialAdminActionState, ok: true, message: t.council.created };
}

/** Marks an alert as over — it disappears from the banner and the page. */
export async function resolveColonyAlertAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));

  try {
    const alert = await prisma.colonyAlert.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });

    const citizens = await getCitizensForSector(alert.sector);
    if (citizens.length > 0) {
      await prisma.notification.createMany({
        data: citizens.map((citizen) => ({
          userId: citizen.id,
          title: `✅ Alerte levée : ${alert.title}`,
          body: "La situation est revenue à la normale.",
          href: "/alertes",
        })),
      });
    }

    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "colony-alert",
      targetId: id,
      detail: "alerte levée",
    });
  } catch {
    return;
  }

  revalidatePath("/alertes");
  revalidatePath("/council/alerts");
  revalidatePath("/");
}

export async function deleteColonyAlertAction(formData: FormData) {
  const session = await requirePageRole(["COUNCIL"]);
  const id = readId(formData.get("id"));

  try {
    await prisma.colonyAlert.delete({ where: { id } });
    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "colony-alert",
      targetId: id,
      detail: "alerte supprimée",
    });
  } catch {
    return;
  }

  revalidatePath("/alertes");
  revalidatePath("/council/alerts");
  revalidatePath("/");
}
