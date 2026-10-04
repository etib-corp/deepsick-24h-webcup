"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { submitDataConcernAction } from "@/lib/actions/privacy";
import { initialActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.privacy.submitting : t.privacy.submit}
    </Button>
  );
}

/**
 * F51 — raise a concern about how the city uses personal data. The
 * acknowledgement shows the reference stored with the concern, and the
 * decision trace follows in the list below the form.
 */
export function DataConcernForm() {
  const t = useT();
  const router = useRouter();
  const [state, formAction] = useFormState(submitDataConcernAction, initialActionState);

  // A new concern joins the list right away.
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-mono text-sm text-foreground">{t.privacy.formTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.privacy.formHint}</p>
      </div>

      {state.ok ? (
        <Alert autoFocus tone="success" title={t.privacy.sent}>
          <p>{t.privacy.sentHint}</p>
          {state.reference ? (
            <p className="mt-2">
              {t.privacy.reference}{" "}
              <span className="font-mono text-foreground">{state.reference}</span>
            </p>
          ) : null}
        </Alert>
      ) : null}

      <SubmissionForm action={formAction} className="space-y-4">
        {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

        <Field label={t.privacy.subject} htmlFor="concern-subject">
          <Input
            id="concern-subject"
            name="subject"
            required
            maxLength={160}
            placeholder={t.privacy.subjectPlaceholder}
          />
        </Field>

        <Field label={t.privacy.body} htmlFor="concern-body" hint={t.privacy.bodyHint}>
          <Textarea
            id="concern-body"
            name="body"
            required
            minLength={10}
            placeholder={t.privacy.bodyPlaceholder}
          />
        </Field>

        <SubmitButton />
      </SubmissionForm>
    </div>
  );
}
