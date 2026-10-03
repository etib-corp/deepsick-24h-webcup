"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { TramFront, Utensils } from "lucide-react";

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
  const [selectedType, setSelectedType] = useState(defaultType === "FOOD" ? "FOOD" : "TAXI");
  const copy = t.citizen.orders;
  const isFood = selectedType === "FOOD";

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
    <SubmissionForm action={formAction} className="flex flex-col gap-5">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <fieldset className="min-w-0">
        <legend className="font-mono text-xs uppercase tracking-wide text-foreground">
          {t.citizen.orders.type}
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ORDER_TYPES.map((type) => (
            <label
              key={type}
              className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name="type"
                value={type}
                checked={type === selectedType}
                onChange={() => setSelectedType(type)}
                className="mt-1 shrink-0 accent-primary"
              />
              <span className="flex min-w-0 flex-col gap-2">
                {type === "TAXI" ? <TramFront aria-hidden="true" className="size-5 text-primary" /> : <Utensils aria-hidden="true" className="size-5 text-primary" />}
                <span className="font-mono text-sm">{type === "TAXI" ? `${t.orderType.TAXI} · Hermes` : `${t.orderType.FOOD} · Mercator`}</span>
                <span className="text-sm text-muted-foreground">{type === "TAXI" ? copy.taxiHint : copy.foodHint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={isFood ? copy.foodSummary : copy.summary} htmlFor="summary">
        <Input
          id="summary"
          name="summary"
          required
          minLength={3}
          maxLength={160}
          placeholder={isFood ? copy.foodSummaryPlaceholder : copy.summaryPlaceholder}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4">
        <Field label={isFood ? copy.foodOrigin : copy.origin} htmlFor="origin" hint={copy.optionalHint}>
          <Input id="origin" name="origin" maxLength={120} placeholder={isFood ? copy.foodOriginPlaceholder : copy.originPlaceholder} />
        </Field>
        <Field label={isFood ? copy.foodDestination : copy.destination} htmlFor="destination" hint={copy.optionalHint}>
          <Input
            id="destination"
            name="destination"
            maxLength={120}
            placeholder={isFood ? copy.foodDestinationPlaceholder : copy.destinationPlaceholder}
          />
        </Field>
      </div>

      <SubmitButton />
    </SubmissionForm>
  );
}
