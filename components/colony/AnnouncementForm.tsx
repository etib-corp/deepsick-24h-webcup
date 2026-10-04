"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { createAnnouncementAction } from "@/lib/actions/admin";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.council.announcements.form.submitting : t.council.announcements.form.submit}
    </Button>
  );
}

export function AnnouncementForm() {
  const t = useT();
  const [state, formAction] = useFormState(createAnnouncementAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-4" data-tour="announcement-form">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field label={t.council.announcements.form.title} htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          placeholder={t.council.announcements.form.titlePlaceholder}
        />
      </Field>

      <Field
        label={t.council.announcements.form.excerpt}
        htmlFor="excerpt"
        hint={t.council.announcements.form.excerptHint}
      >
        <Input id="excerpt" name="excerpt" maxLength={280} />
      </Field>

      <Field label={t.council.announcements.form.body} htmlFor="body">
        <Textarea id="body" name="body" required className="min-h-36" />
      </Field>

      <Field
        label={t.council.announcements.form.plainLanguage}
        htmlFor="plainLanguage"
        hint={t.council.announcements.form.plainLanguageHint}
      >
        <Textarea id="plainLanguage" name="plainLanguage" className="min-h-24" />
      </Field>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="published" className="size-4 accent-primary" />
        {t.council.announcements.form.publishNow}
      </label>

      <div data-tour="announcement-submit">
        <SubmitButton />
      </div>
    </form>
  );
}
