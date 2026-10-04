"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { initialAdminActionState } from "@/lib/action-state";
import { setConsultationOutcomeAction } from "@/lib/actions/admin";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? t.council.consultations.outcome.saving : t.council.consultations.outcome.save}
    </Button>
  );
}

/** Council-only editor for the public outcome of a consultation. */
export function ConsultationOutcomeForm({
  consultationId,
  initialOutcome,
}: {
  consultationId: string;
  initialOutcome?: string | null;
}) {
  const t = useT();
  const [state, formAction] = useFormState(setConsultationOutcomeAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-3">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <input type="hidden" name="id" value={consultationId} />

      <Field
        label={t.council.consultations.outcome.title}
        htmlFor="outcome"
        hint={t.council.consultations.outcome.hint}
      >
        <Textarea
          id="outcome"
          name="outcome"
          defaultValue={initialOutcome ?? ""}
          placeholder={t.council.consultations.outcome.placeholder}
          className="min-h-28"
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
