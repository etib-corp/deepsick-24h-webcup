"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createDisruptionAction } from "@/lib/actions/disruptions";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";
import { TRANSIT_LINES } from "@/lib/transit";

const selectClasses =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.disruptions.console.submitting : t.disruptions.console.submit}
    </Button>
  );
}

/**
 * F97 — Hermes console form: publish a line interruption with the
 * replacement solution residents should use. The result appears immediately
 * on the public /transport page.
 */
export function DisruptionForm() {
  const t = useT();
  const [state, formAction] = useFormState(createDisruptionAction, initialAdminActionState);

  return (
    <div className="space-y-3">
      {state.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}
      {!state.ok && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <SubmissionForm action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.disruptions.console.line} htmlFor="disruption-line">
            <select id="disruption-line" name="lineId" required className={selectClasses}>
              {TRANSIT_LINES.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t.disruptions.console.severity} htmlFor="disruption-severity">
            <select
              id="disruption-severity"
              name="severity"
              required
              defaultValue="MAJOR"
              className={selectClasses}
            >
              {(["MINOR", "MAJOR", "CRITICAL"] as const).map((severity) => (
                <option key={severity} value={severity}>
                  {t.disruptions.console.severities[severity]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t.disruptions.console.title} htmlFor="disruption-title">
          <Input
            id="disruption-title"
            name="title"
            required
            maxLength={160}
            placeholder={t.disruptions.console.titlePlaceholder}
          />
        </Field>

        <Field label={t.disruptions.console.message} htmlFor="disruption-message">
          <Textarea
            id="disruption-message"
            name="message"
            required
            minLength={10}
            placeholder={t.disruptions.console.messagePlaceholder}
          />
        </Field>

        <Field
          label={t.disruptions.console.alternative}
          htmlFor="disruption-alternative"
          hint={t.disruptions.console.alternativeHint}
        >
          <Textarea
            id="disruption-alternative"
            name="alternative"
            required
            minLength={5}
            placeholder={t.disruptions.console.alternativePlaceholder}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.disruptions.console.alternativeLine}
            htmlFor="disruption-alternative-line"
          >
            <select
              id="disruption-alternative-line"
              name="alternativeLineId"
              defaultValue=""
              className={selectClasses}
            >
              <option value="">{t.disruptions.console.none}</option>
              {TRANSIT_LINES.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t.disruptions.console.endsAt} htmlFor="disruption-ends-at">
            <Input id="disruption-ends-at" name="endsAt" type="datetime-local" />
          </Field>
        </div>

        <SubmitButton />
      </SubmissionForm>
    </div>
  );
}
