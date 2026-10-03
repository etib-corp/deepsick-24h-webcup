"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createConsultationAction } from "@/lib/actions/admin";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.council.consultations.form.submitting : t.council.consultations.form.submit}
    </Button>
  );
}

export function ConsultationForm() {
  const t = useT();
  const [state, formAction] = useFormState(createConsultationAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field label={t.council.consultations.form.title} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t.council.consultations.form.titlePlaceholder}
        />
      </Field>

      <Field
        label={t.council.consultations.form.summary}
        htmlFor="summary"
        hint={t.council.consultations.form.summaryHint}
      >
        <Input id="summary" name="summary" maxLength={400} />
      </Field>

      <Field label={t.council.consultations.form.description} htmlFor="description">
        <Textarea id="description" name="description" required className="min-h-32" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.council.consultations.form.opensAt} htmlFor="opensAt">
          <Input id="opensAt" name="opensAt" type="datetime-local" />
        </Field>
        <Field label={t.council.consultations.form.closesAt} htmlFor="closesAt">
          <Input id="closesAt" name="closesAt" type="datetime-local" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="published" defaultChecked className="size-4 accent-primary" />
        {t.council.consultations.form.published}
      </label>

      <SubmitButton />
    </form>
  );
}
