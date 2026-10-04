"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { submitIdeaAction } from "@/lib/actions/ideas";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.citizen.ideas.form.submitting : t.citizen.ideas.form.submit}
    </Button>
  );
}

/** F68 — citizen form proposing an idea to improve the colony. */
export function IdeaForm() {
  const t = useT();
  const [state, formAction] = useFormState(submitIdeaAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      {state.ok && state.reference ? (
        <Alert tone="success">
          {format(t.citizen.ideas.sent, { reference: state.reference })}
        </Alert>
      ) : null}

      <Field label={t.citizen.ideas.form.title} htmlFor="idea-title">
        <Input
          id="idea-title"
          name="title"
          required
          placeholder={t.citizen.ideas.form.titlePlaceholder}
        />
      </Field>

      <Field label={t.citizen.ideas.form.body} htmlFor="idea-body">
        <Textarea id="idea-body" name="body" required className="min-h-32" />
      </Field>

      <SubmitButton />
    </form>
  );
}
