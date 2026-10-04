"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { initialAdminActionState } from "@/lib/action-state";
import { createProjectAction } from "@/lib/actions/projects";
import { useT } from "@/lib/i18n/client";
import { COLONY_SECTORS, PROJECT_STATUSES } from "@/lib/roles";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.council.projects.form.submitting : t.council.projects.form.submit}
    </Button>
  );
}

/** F67 — Council form creating a public city project. */
export function ProjectForm() {
  const t = useT();
  const [state, formAction] = useFormState(createProjectAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field label={t.council.projects.form.title} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t.council.projects.form.titlePlaceholder}
        />
      </Field>

      <Field
        label={t.council.projects.form.summary}
        htmlFor="summary"
        hint={t.council.projects.form.summaryHint}
      >
        <Input id="summary" name="summary" maxLength={400} />
      </Field>

      <Field label={t.council.projects.form.description} htmlFor="description">
        <Textarea id="description" name="description" required className="min-h-32" />
      </Field>

      <Field label={t.council.projects.form.sector} htmlFor="sector">
        <Select id="sector" name="sector" defaultValue="">
          <option value="">{t.common.none}</option>
          {COLONY_SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.council.projects.form.status} htmlFor="status">
          <Select id="status" name="status" defaultValue="PLANNED">
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.council.projects.statusOptions[status]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.council.projects.form.progress} htmlFor="progress">
          <Input id="progress" name="progress" type="number" min={0} max={100} step={1} placeholder="0" />
        </Field>
      </div>

      <SubmitButton />
    </form>
  );
}
