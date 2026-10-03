import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Alert, EmptyState } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AppointmentStatusBadge } from "@/components/ui/StatusBadge";
import { cancelAppointmentAction } from "@/lib/actions/appointments";
import { getAppointments } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { ensureAppointmentReminders } from "@/lib/services";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.appointments.title };
}

export default async function CitizenAppointmentsPage({
  searchParams,
}: {
  searchParams: { annule?: string };
}) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);

  // Deliver any due pre-appointment reminder (F40), then render the list.
  await ensureAppointmentReminders(session.user.id);
  const appointments = await getAppointments(session.user.id);

  const now = Date.now();
  const upcoming = appointments.filter(
    (appointment) => appointment.status === "BOOKED" && appointment.date.getTime() > now,
  );
  const past = appointments
    .filter((appointment) => appointment.status !== "BOOKED" || appointment.date.getTime() <= now)
    .reverse();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl text-foreground">{t.citizen.appointments.title}</h1>
          <p className="text-sm text-muted-foreground">{t.citizen.appointments.subtitle}</p>
        </div>
        <Link href="/citizen/appointments/nouveau" className={buttonClasses("primary", "sm")}>
          {t.citizen.appointments.newAppointment}
        </Link>
      </header>

      {searchParams.annule === "1" ? (
        <Alert tone="info">{t.citizen.appointments.cancelled}</Alert>
      ) : null}

      <section>
        <SectionHeader
          title={t.citizen.appointments.upcoming}
          badge={<span className="font-mono text-[11px] text-muted-foreground">{upcoming.length}</span>}
        />

        {upcoming.length === 0 ? (
          <EmptyState title={t.citizen.appointments.empty} description={t.citizen.appointments.emptyHint} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => {
              const minutesLeft = Math.ceil((appointment.date.getTime() - now) / 60000);
              const reminderLead =
                minutesLeft <= 60
                  ? t.citizen.appointments.reminderSoon
                  : format(t.citizen.appointments.reminderLead, { minutes: minutesLeft });

              return (
                <Card key={appointment.id} className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl" aria-hidden>
                        {appointment.service.icon ?? "🗓️"}
                      </span>
                      <div>
                        <p className="font-mono text-sm text-foreground">
                          {appointment.reference} · {appointment.service.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                          {formatDateTime(appointment.date)}
                        </p>
                      </div>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>

                  {appointment.subject ? (
                    <p className="text-sm text-muted-foreground">{appointment.subject}</p>
                  ) : null}

                  <Alert tone="info" title={t.citizen.appointments.reminderTitle}>
                    {reminderLead}
                  </Alert>

                  <div className="space-y-1 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                    <p className="font-mono text-xs uppercase tracking-wide text-foreground">
                      {t.citizen.appointments.preparation}
                    </p>
                    <p className="text-muted-foreground">{t.citizen.appointments.preparationText}</p>
                    {appointment.sector ? (
                      <p className="text-xs text-muted-foreground">
                        {t.citizen.appointments.location} · {appointment.sector}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {t.citizen.appointments.duration} ·{" "}
                      {format(t.citizen.appointments.minutes, { count: appointment.durationMinutes })}
                    </p>
                  </div>

                  <form action={cancelAppointmentAction}>
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <button
                      type="submit"
                      className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground hover:text-destructive"
                    >
                      {t.citizen.appointments.cancel}
                    </button>
                  </form>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title={t.citizen.appointments.past}
          badge={<span className="font-mono text-[11px] text-muted-foreground">{past.length}</span>}
        />
        {past.length === 0 ? null : (
          <div className="space-y-2">
            {past.map((appointment) => (
              <FeedRow
                key={appointment.id}
                icon={appointment.service.icon ?? "🗓️"}
                title={`${appointment.reference} · ${appointment.service.name}`}
                meta={`${formatDateTime(appointment.date)}${appointment.subject ? ` · ${appointment.subject}` : ""}`}
                trailing={<AppointmentStatusBadge status={appointment.status} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
