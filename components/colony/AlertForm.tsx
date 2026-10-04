"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createColonyAlertAction } from "@/lib/actions/alerts";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

const selectClasses =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.alerts.council.submitting : t.alerts.council.submit}
    </Button>
  );
}

/**
 * F101 — crisis cell form: publishing an alert makes it visible everywhere
 * within seconds and pushes a notification to the concerned citizens.
 */
export function AlertForm() {
  const t = useT();
  const [state, formAction] = useFormState(createColonyAlertAction, initialAdminActionState);

  return (
    <div className="space-y-3">
      {state.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}
      {!state.ok && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <SubmissionForm action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.alerts.council.severity} htmlFor="alert-severity">
            <select
              id="alert-severity"
              name="severity"
              required
              defaultValue="WARNING"
              className={selectClasses}
            >
              {(["ADVISORY", "WARNING", "CRITICAL"] as const).map((severity) => (
                <option key={severity} value={severity}>
                  {t.alerts.severities[severity]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t.alerts.council.sector}
            htmlFor="alert-sector"
            hint={t.alerts.council.sectorHint}
          >
            <Input
              id="alert-sector"
              name="sector"
              maxLength={80}
              placeholder={t.alerts.council.sectorPlaceholder}
            />
          </Field>
        </div>

        <Field label={t.alerts.council.title} htmlFor="alert-title">
          <Input
            id="alert-title"
            name="title"
            required
            maxLength={160}
            placeholder={t.alerts.council.titlePlaceholder}
          />
        </Field>

        <Field label={t.alerts.council.situation} htmlFor="alert-situation">
          <Textarea
            id="alert-situation"
            name="situation"
            required
            minLength={10}
            placeholder={t.alerts.council.situationPlaceholder}
          />
        </Field>

        <Field
          label={t.alerts.council.instructions}
          htmlFor="alert-instructions"
          hint={t.alerts.council.instructionsHint}
        >
          <Textarea
            id="alert-instructions"
            name="instructions"
            required
            minLength={5}
            placeholder={t.alerts.council.instructionsPlaceholder}
          />
        </Field>

        <SubmitButton />
      </SubmissionForm>
    </div>
  );
}
