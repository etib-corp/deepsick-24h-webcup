"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { submitOpinionAction } from "@/lib/actions/opinions";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";
import { OPINION_STANCES } from "@/lib/roles";
import { cn } from "@/lib/ui";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? t.citizen.consultations.form.submitting : t.citizen.consultations.form.submit}
    </Button>
  );
}

export function OpinionForm({
  consultationId,
  initialStance,
  initialComment,
  anonymous = false,
}: {
  consultationId: string;
  initialStance?: string | null;
  initialComment?: string | null;
  anonymous?: boolean;
}) {
  const t = useT();
  const [state, formAction] = useFormState(submitOpinionAction, initialActionState);

  return (
    <form action={formAction} className="space-y-4">
      {anonymous ? (
        <p className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
          {t.citizen.consultations.anonymousNote}
        </p>
      ) : null}

      {state.ok && state.reference ? (
        <Alert tone="success">
          {format(t.citizen.consultations.confirmation, { reference: state.reference })}
        </Alert>
      ) : null}
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <input type="hidden" name="consultationId" value={consultationId} />

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-foreground">
          {t.citizen.consultations.form.stance}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {OPINION_STANCES.map((stance) => (
            <label
              key={stance}
              className={cn(
                "cursor-pointer rounded-md border border-border px-3 py-2 text-center font-mono text-xs uppercase tracking-wide transition",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary",
              )}
            >
              <input
                type="radio"
                name="stance"
                value={stance}
                defaultChecked={(initialStance ?? "NEUTRAL") === stance}
                className="sr-only"
              />
              {t.citizen.consultations.stance[stance]}
            </label>
          ))}
        </div>
      </div>

      <Field
        label={t.citizen.consultations.form.comment}
        htmlFor="comment"
        hint={t.citizen.consultations.form.commentHint}
      >
        <Textarea
          id="comment"
          name="comment"
          required
          minLength={10}
          maxLength={2000}
          defaultValue={initialComment ?? ""}
          placeholder={t.citizen.consultations.form.commentHint}
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
