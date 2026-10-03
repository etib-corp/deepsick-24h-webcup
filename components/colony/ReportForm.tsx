"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionConfirmation } from "@/components/forms/SubmissionConfirmation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { createReportAction } from "@/lib/actions/reports";
import { useT } from "@/lib/i18n/client";
import { COLONY_SECTORS, REPORT_PRIORITIES, REPORT_TYPES } from "@/lib/roles";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.citizen.report.submitting : t.citizen.report.submit}
    </Button>
  );
}

export function ReportForm({ defaultType = "SECURITY" }: { defaultType?: string }) {
  const t = useT();
  const [state, formAction] = useFormState(createReportAction, initialActionState);

  if (state.ok) {
    return (
      <SubmissionConfirmation
        message={t.citizen.reports.created}
        reference={state.reference}
        href="/citizen/reports"
        linkLabel={t.citizen.reports.title}
      />
    );
  }

  return (
    <SubmissionForm action={formAction} className="space-y-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <fieldset className="space-y-2" data-tour="report-type">
        <legend className="font-mono text-xs uppercase tracking-wide text-foreground">
          {t.citizen.report.service}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {REPORT_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 transition has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                name="type"
                value={type}
                defaultChecked={type === defaultType}
                className="accent-primary"
              />
              <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                {t.reportType[type]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.citizen.report.subject} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder={t.citizen.report.subjectPlaceholder}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.citizen.report.priority} htmlFor="priority">
          <Select id="priority" name="priority" defaultValue="NORMAL">
            {REPORT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {t.reportPriority[priority]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.citizen.report.sector} htmlFor="sector">
          <Select id="sector" name="sector" defaultValue="">
            <option value="">{t.citizen.report.unknownSector}</option>
            {COLONY_SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t.citizen.report.description} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          minLength={10}
          placeholder={t.citizen.report.descriptionPlaceholder}
        />
      </Field>

      <div data-tour="report-submit">
        <SubmitButton />
      </div>
    </SubmissionForm>
  );
}
