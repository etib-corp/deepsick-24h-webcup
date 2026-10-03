"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createBroadcastAction } from "@/lib/actions/admin";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.council.broadcasts.form.submitting : t.council.broadcasts.form.submit}
    </Button>
  );
}

export function BroadcastForm() {
  const t = useT();
  const [state, formAction] = useFormState(createBroadcastAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field label={t.council.broadcasts.form.title} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t.council.broadcasts.form.titlePlaceholder}
        />
      </Field>

      <Field label={t.council.broadcasts.form.message} htmlFor="message">
        <Textarea
          id="message"
          name="message"
          required
          className="min-h-28"
          placeholder={t.council.broadcasts.form.messagePlaceholder}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.council.broadcasts.form.actionLabel}
          htmlFor="actionLabel"
          hint={t.council.broadcasts.form.actionLabelHint}
        >
          <Input id="actionLabel" name="actionLabel" maxLength={60} />
        </Field>

        <Field
          label={t.council.broadcasts.form.actionHref}
          htmlFor="actionHref"
          hint={t.council.broadcasts.form.actionHrefHint}
        >
          <Input id="actionHref" name="actionHref" maxLength={200} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.council.broadcasts.form.startsAt} htmlFor="startsAt">
          <Input id="startsAt" name="startsAt" type="datetime-local" />
        </Field>

        <Field label={t.council.broadcasts.form.endsAt} htmlFor="endsAt">
          <Input id="endsAt" name="endsAt" type="datetime-local" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="active" defaultChecked className="size-4 accent-primary" />
        {t.council.broadcasts.form.active}
      </label>

      <SubmitButton />
    </form>
  );
}
