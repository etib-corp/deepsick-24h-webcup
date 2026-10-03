"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import {
  cancelAppointment,
  createAppointment,
  isAppointmentSlotTaken,
} from "@/lib/services";

const appointmentSchema = z.object({
  serviceId: z.string().trim().min(1),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  date: z.string().min(1),
});

function revalidateAppointments() {
  for (const path of ["/citizen", "/citizen/appointments", "/citizen/notifications"]) {
    revalidatePath(path);
  }
}

export async function createAppointmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePageRole(["CITIZEN"]);
  const t = getDictionary();

  const parsed = appointmentSchema.safeParse({
    serviceId: formData.get("serviceId"),
    subject: formData.get("subject"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return { ok: false, message: t.errors.appointmentSlotInvalid };
  }

  let reference: string;
  try {
    if (await isAppointmentSlotTaken(parsed.data.serviceId, date)) {
      return { ok: false, message: t.errors.appointmentSlotTaken };
    }

    const appointment = await createAppointment(session.user.id, {
      serviceId: parsed.data.serviceId,
      subject: parsed.data.subject || null,
      date,
    });
    reference = appointment.reference;
  } catch {
    return { ok: false, message: t.errors.appointmentFailed };
  }

  revalidateAppointments();
  return { ok: true, reference };
}

export async function cancelAppointmentAction(formData: FormData) {
  const session = await requirePageRole(["CITIZEN"]);
  const id = String(formData.get("appointmentId") ?? "");
  if (!id) return;

  await cancelAppointment(id, session.user.id);
  revalidateAppointments();
  redirect("/citizen/appointments?annule=1");
}
