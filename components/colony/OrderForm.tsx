"use client";

import { useFormState, useFormStatus } from "react-dom";

import { SubmissionConfirmation } from "@/components/forms/SubmissionConfirmation";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { createOrderAction } from "@/lib/actions/orders";
import { useT } from "@/lib/i18n/client";
import { ORDER_TYPES } from "@/lib/roles";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.citizen.orders.submitting : t.citizen.orders.submit}
    </Button>
  );
}

export function OrderForm({ defaultType = "TAXI" }: { defaultType?: string }) {
  const t = useT();
  const [state, formAction] = useFormState(createOrderAction, initialActionState);

  if (state.ok) {
    return (
      <SubmissionConfirmation
        message={t.citizen.orders.created}
        reference={state.reference}
        href="/citizen/requests"
        linkLabel={t.citizen.tracking.title}
      />
    );
  }

  return (
    <SubmissionForm action={formAction} className="space-y-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <fieldset className="space-y-2">
        <legend className="font-mono text-xs uppercase tracking-wide text-foreground">
          {t.citizen.orders.type}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {ORDER_TYPES.map((type) => (
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
                {type === "TAXI" ? `🚡 ${t.orderType.TAXI}` : `🍜 ${t.orderType.FOOD}`}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t.citizen.orders.summary} htmlFor="summary">
        <Input
          id="summary"
          name="summary"
          required
          placeholder={t.citizen.orders.summaryPlaceholder}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.citizen.orders.origin} htmlFor="origin">
          <Input id="origin" name="origin" placeholder={t.citizen.orders.originPlaceholder} />
        </Field>
        <Field label={t.citizen.orders.destination} htmlFor="destination">
          <Input
            id="destination"
            name="destination"
            placeholder={t.citizen.orders.destinationPlaceholder}
          />
        </Field>
      </div>

      <SubmitButton />
    </SubmissionForm>
  );
}
