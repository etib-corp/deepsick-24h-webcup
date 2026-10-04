"use server";

import { revalidatePath } from "next/cache";

import type { AdminActionState } from "@/lib/action-state";
import { initialAdminActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { auditActor, auditNeutralizedInputs, recordSecurityEvent } from "@/lib/security";
import { readId } from "@/lib/sanitize";
import { TRANSIT_LINES } from "@/lib/transit";

const SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"] as const;

function text(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * F97 — Hermes operations publish a line interruption with the replacement
 * solution residents should use. Only DRIVER / COUNCIL can manage them; the
 * public transport page shows the live ones immediately.
 */
export async function createDisruptionAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const t = getDictionary().disruptions;
  const session = await requirePageRole(["DRIVER", "COUNCIL"]);

  const title = text(formData.get("title"), 160);
  const message = text(formData.get("message"), 2000);
  const alternative = text(formData.get("alternative"), 2000);
  const lineId = text(formData.get("lineId"), 60);
  const severity = text(formData.get("severity"), 12);
  const alternativeLineId = text(formData.get("alternativeLineId"), 60);
  const endsAtRaw = text(formData.get("endsAt"), 40);

  const line = TRANSIT_LINES.find((entry) => entry.id === lineId);
  const alternativeLine = TRANSIT_LINES.find((entry) => entry.id === alternativeLineId);
  if (!line) return { ok: false, message: t.errors.line };
  if (title.length < 3) return { ok: false, message: t.errors.title };
  if (message.length < 10) return { ok: false, message: t.errors.message };
  if (alternative.length < 5) return { ok: false, message: t.errors.alternative };
  if (!(SEVERITIES as readonly string[]).includes(severity)) {
    return { ok: false, message: t.errors.severity };
  }

  let endsAt: Date | null = null;
  if (endsAtRaw) {
    const parsed = new Date(endsAtRaw);
    if (Number.isNaN(parsed.getTime())) return { ok: false, message: t.errors.endsAt };
    endsAt = parsed;
  }

  await auditNeutralizedInputs(
    { title: formData.get("title"), message: formData.get("message") },
    "perturbation transport",
    session,
  );

  try {
    await prisma.transitDisruption.create({
      data: {
        lineId: line.id,
        title,
        message,
        alternative,
        alternativeLineId: alternativeLine?.id ?? null,
        severity,
        endsAt,
        active: true,
        authorId: session.user.id,
      },
    });
  } catch {
    return { ok: false, message: getDictionary().errors.unexpected };
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(session),
    targetType: "transit-disruption",
    targetId: line.id,
    detail: `perturbation publiée · ${title}`,
  });

  revalidatePath("/transport");
  revalidatePath("/operations/transport");
  return { ...initialAdminActionState, ok: true, message: t.console.created };
}

/** Marks a disruption as over — it disappears from the public page. */
export async function resolveDisruptionAction(formData: FormData) {
  const session = await requirePageRole(["DRIVER", "COUNCIL"]);
  const id = readId(formData.get("id"));

  try {
    const disruption = await prisma.transitDisruption.update({
      where: { id },
      data: { active: false, endsAt: new Date() },
    });
    await recordSecurityEvent({
      type: "CONTENT_CHANGED",
      outcome: "SUCCESS",
      ...auditActor(session),
      targetType: "transit-disruption",
      targetId: id,
      detail: `perturbation levée · ${disruption.lineId}`,
    });
  } catch {
    return;
  }

  revalidatePath("/transport");
  revalidatePath("/operations/transport");
}
