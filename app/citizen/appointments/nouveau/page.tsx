import type { Metadata } from "next";
import Link from "next/link";

import {
  AppointmentForm,
  type AppointmentSlotGroup,
} from "@/components/colony/AppointmentForm";
import { EmptyState } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { getAvailableSlots, getPublishedServices } from "@/lib/data";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

const INTL_LOCALES = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
} as const;

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.appointments.bookTitle };
}

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { service?: string };
}) {
  const t = getDictionary();
  const locale = getLocale();
  await requirePageRole(["CITIZEN"]);

  const services = await getPublishedServices();
  const selected = services.find((service) => service.id === searchParams.service) ?? services[0];

  const intlLocale = INTL_LOCALES[locale];
  const dayFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  let slotGroups: AppointmentSlotGroup[] = [];
  if (selected) {
    const slots = await getAvailableSlots(selected.id);
    const groups = new Map<string, AppointmentSlotGroup>();
    for (const slot of slots) {
      const dateKey = localDateKey(slot.date);
      const group = groups.get(dateKey) ?? {
        dateKey,
        dayLabel: dayFormatter.format(slot.date),
        slots: [],
      };
      group.slots.push({
        iso: slot.date.toISOString(),
        time: timeFormatter.format(slot.date),
        available: slot.available,
      });
      groups.set(dateKey, group);
    }
    slotGroups = [...groups.values()];
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/citizen/appointments" className="text-sm text-primary hover:underline">
          {t.citizen.appointments.back}
        </Link>
        <h1 className="mt-2 font-mono text-xl text-foreground">{t.citizen.appointments.bookTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.appointments.bookSubtitle}</p>
      </header>

      {services.length === 0 ? (
        <EmptyState title={t.publicPages.services.empty} description={t.publicPages.services.emptyHint} />
      ) : (
        <div className="space-y-6">
          <section>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t.citizen.appointments.chooseService}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {services.map((service) => {
                const active = service.id === selected?.id;
                return (
                  <Link
                    key={service.id}
                    href={`/citizen/appointments/nouveau?service=${service.id}`}
                    className={cn(
                      "shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-xs transition",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <span aria-hidden>{service.icon ?? "🏛️"}</span> {service.name}
                  </Link>
                );
              })}
            </div>
          </section>

          {selected ? (
            <Card className="p-4">
              <AppointmentForm
                service={{ id: selected.id, name: selected.name, icon: selected.icon, preparation: selected.preparation }}
                slotGroups={slotGroups}
              />
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
