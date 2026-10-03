"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { SubmissionConfirmation } from "@/components/forms/SubmissionConfirmation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { createAppointmentAction } from "@/lib/actions/appointments";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/ui";

export type AppointmentSlotGroup = {
  dateKey: string;
  dayLabel: string;
  slots: { iso: string; time: string; available: boolean }[];
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="w-full">
      {pending ? t.citizen.appointments.submitting : t.citizen.appointments.submit}
    </Button>
  );
}

export function AppointmentForm({
  service,
  slotGroups,
}: {
  service: { id: string; name: string; icon?: string | null; preparation?: string | null };
  slotGroups: AppointmentSlotGroup[];
}) {
  const t = useT();
  const [state, formAction] = useFormState(createAppointmentAction, initialActionState);
  const [selectedDay, setSelectedDay] = useState(slotGroups[0]?.dateKey ?? "");
  const [selectedIso, setSelectedIso] = useState("");

  const activeGroup = useMemo(
    () => slotGroups.find((group) => group.dateKey === selectedDay) ?? slotGroups[0],
    [slotGroups, selectedDay],
  );

  const selectedLabel = useMemo(() => {
    if (!selectedIso || !activeGroup) return null;
    const slot = activeGroup.slots.find((item) => item.iso === selectedIso);
    if (!slot) return null;
    return `${activeGroup.dayLabel} · ${slot.time}`;
  }, [selectedIso, activeGroup]);

  if (state.ok) {
    return (
      <SubmissionConfirmation
        message={t.citizen.appointments.created}
        reference={state.reference}
        href="/citizen/appointments"
        linkLabel={t.citizen.appointments.title}
      />
    );
  }

  return (
    <SubmissionForm action={formAction} className="space-y-5">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="date" value={selectedIso} />

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <span aria-hidden className="text-lg">
          {service.icon ?? "🗓️"}
        </span>
        <div>
          <p className="font-mono text-sm text-foreground">{service.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {t.citizen.appointments.service}
          </p>
        </div>
      </div>

      <Field label={t.citizen.appointments.subject} htmlFor="subject">
        <Input
          id="subject"
          name="subject"
          placeholder={t.citizen.appointments.subjectPlaceholder}
        />
      </Field>

      {service.preparation ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
          <p className="font-mono text-xs uppercase tracking-wide text-foreground">
            {t.citizen.appointments.preparation}
          </p>
          <p className="text-muted-foreground">{service.preparation}</p>
        </div>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="font-mono text-xs uppercase tracking-wide text-foreground">
          {t.citizen.appointments.chooseDay}
        </legend>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slotGroups.map((group) => {
            const active = group.dateKey === selectedDay;
            const hasAvailable = group.slots.some((slot) => slot.available);
            return (
              <button
                key={group.dateKey}
                type="button"
                onClick={() => {
                  setSelectedDay(group.dateKey);
                  setSelectedIso("");
                }}
                className={cn(
                  "shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-xs transition",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:border-primary/50",
                )}
              >
                {group.dayLabel}
                {hasAvailable ? null : (
                  <span className="ml-1 text-muted-foreground">· {t.citizen.appointments.full}</span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {activeGroup ? (
        <fieldset className="space-y-2">
          <legend className="font-mono text-xs uppercase tracking-wide text-foreground">
            {t.citizen.appointments.chooseSlot}
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {activeGroup.slots.map((slot) => {
              const selected = slot.iso === selectedIso;
              return (
                <button
                  key={slot.iso}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedIso(slot.iso)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 font-mono text-xs transition",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : slot.available
                        ? "border-border bg-card text-foreground hover:border-primary/50"
                        : "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground line-through",
                  )}
                >
                  {slot.time}
                </button>
              );
            })}
          </div>
          {!activeGroup.slots.some((slot) => slot.available) ? (
            <p className="text-xs text-muted-foreground">{t.citizen.appointments.noSlots}</p>
          ) : null}
        </fieldset>
      ) : null}

      {selectedLabel ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2 font-mono text-xs text-foreground">
          {t.citizen.appointments.summary} · <span className="text-primary">{selectedLabel}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t.citizen.appointments.pickSlotHint}</p>
      )}

      <SubmitButton disabled={!selectedIso} />
    </SubmissionForm>
  );
}
