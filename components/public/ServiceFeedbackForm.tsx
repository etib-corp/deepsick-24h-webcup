"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.publicPages.services.feedback.submitting : t.publicPages.services.feedback.submit}
    </Button>
  );
}

/** F76 — comment form shown on the service page to signed-in citizens. */
export function ServiceFeedbackForm({
  serviceId,
  initialComment,
}: {
  serviceId: string;
  initialComment: string;
}) {
  const t = useT();
  const [state, formAction] = useFormState(submitFeedbackAction, initialActionState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <Field label={t.publicPages.services.feedback.title} htmlFor="feedback-comment">
        <Textarea
          id="feedback-comment"
          name="comment"
          required
          defaultValue={initialComment}
          placeholder={t.publicPages.services.feedback.placeholder}
          className="min-h-24"
        />
      </Field>
      <SubmitButton />
    </form>
  );
}