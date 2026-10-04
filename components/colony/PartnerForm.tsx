"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createPartnerAction } from "@/lib/actions/partners";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t.partners.council.submitting : t.partners.council.submit}
    </Button>
  );
}

/** F99 — Council form to publish an external partner on /partenaires. */
export function PartnerForm() {
  const t = useT();
  const [state, formAction] = useFormState(createPartnerAction, initialAdminActionState);

  return (
    <div className="space-y-3">
      {state.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}
      {!state.ok && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <SubmissionForm action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.partners.council.name} htmlFor="partner-name">
            <Input
              id="partner-name"
              name="name"
              required
              maxLength={160}
              placeholder={t.partners.council.namePlaceholder}
            />
          </Field>
          <Field label={t.partners.council.category} htmlFor="partner-category">
            <Input
              id="partner-category"
              name="category"
              maxLength={80}
              placeholder={t.partners.council.categoryPlaceholder}
            />
          </Field>
        </div>

        <Field label={t.partners.council.description} htmlFor="partner-description">
          <Textarea
            id="partner-description"
            name="description"
            required
            minLength={10}
            placeholder={t.partners.council.descriptionPlaceholder}
          />
        </Field>

        <Field label={t.partners.council.contact} htmlFor="partner-contact">
          <Input
            id="partner-contact"
            name="contact"
            maxLength={160}
            placeholder={t.partners.council.contactPlaceholder}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.partners.council.actionLabel} htmlFor="partner-action-label">
            <Input
              id="partner-action-label"
              name="actionLabel"
              maxLength={60}
              placeholder={t.partners.council.actionLabelPlaceholder}
            />
          </Field>
          <Field label={t.partners.council.actionHref} htmlFor="partner-action-href">
            <Input
              id="partner-action-href"
              name="actionHref"
              maxLength={255}
              placeholder="/contact"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.partners.council.opensAt} htmlFor="partner-opens-at">
            <Input id="partner-opens-at" name="opensAt" type="time" />
          </Field>
          <Field
            label={t.partners.council.closesAt}
            htmlFor="partner-closes-at"
            hint={t.partners.council.windowHint}
          >
            <Input id="partner-closes-at" name="closesAt" type="time" />
          </Field>
        </div>

        <SubmitButton />
      </SubmissionForm>
    </div>
  );
}
