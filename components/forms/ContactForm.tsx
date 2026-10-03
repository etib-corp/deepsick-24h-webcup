"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { contactAction } from "@/lib/actions/contact";
import { initialActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.publicPages.contact.submitting : t.publicPages.contact.submit}
    </Button>
  );
}

export function ContactForm() {
  const t = useT();
  const [state, formAction] = useFormState(contactAction, initialActionState);

  if (state.ok) {
    return (
      <Alert autoFocus tone="success" title={t.publicPages.contact.sent}>
        <p>{state.message}</p>
        {state.reference ? (
          <p className="mt-2">
            {t.publicPages.contact.reference}{" "}
            <span className="font-mono text-foreground">{state.reference}</span>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-emerald-200/80">{t.publicPages.contact.keepReference}</p>
      </Alert>
    );
  }

  return (
    <SubmissionForm action={formAction} className="space-y-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <Field label={t.publicPages.contact.subject} htmlFor="subject">
        <Input
          id="subject"
          name="subject"
          required
          maxLength={120}
          placeholder={t.publicPages.contact.subjectPlaceholder}
        />
      </Field>

      <Field
        label={t.publicPages.contact.email}
        htmlFor="email"
        hint={t.publicPages.contact.emailHint}
      >
        <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
      </Field>

      <Field label={t.publicPages.contact.body} htmlFor="body">
        <Textarea
          id="body"
          name="body"
          required
          minLength={10}
          placeholder={t.publicPages.contact.bodyPlaceholder}
        />
      </Field>

      <SubmitButton />
    </SubmissionForm>
  );
}
