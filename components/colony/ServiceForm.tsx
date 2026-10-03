"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { createServiceAction } from "@/lib/actions/admin";
import { initialAdminActionState } from "@/lib/action-state";
import { useT } from "@/lib/i18n/client";
import { COLONY_SECTORS } from "@/lib/roles";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.council.services.form.submitting : t.council.services.form.submit}
    </Button>
  );
}

export function ServiceForm() {
  const t = useT();
  const [state, formAction] = useFormState(createServiceAction, initialAdminActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field label={t.council.services.form.name} htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          placeholder={t.council.services.form.namePlaceholder}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.council.services.form.category} htmlFor="category">
          <Input
            id="category"
            name="category"
            placeholder={t.council.services.form.categoryPlaceholder}
          />
        </Field>
        <Field label={t.council.services.form.icon} htmlFor="icon">
          <Input id="icon" name="icon" maxLength={4} placeholder="🛠️" />
        </Field>
      </div>

      <Field label={t.council.services.form.description} htmlFor="description">
        <Textarea id="description" name="description" required />
      </Field>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="featured" value="true" className="size-4 accent-primary" />
        {t.council.services.form.featured}
      </label>
      <p className="-mt-2 text-xs text-muted-foreground">
        {t.council.services.form.featuredHint}
      </p>

      <Field label={t.council.services.form.sector} htmlFor="sector">
        <Select id="sector" name="sector" defaultValue="">
          <option value="">{t.common.none}</option>
          {COLONY_SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.council.services.form.mapX} htmlFor="mapX" hint={t.council.services.form.mapHint}>
          <Input
            id="mapX"
            name="mapX"
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="0.50"
          />
        </Field>
        <Field label={t.council.services.form.mapY} htmlFor="mapY">
          <Input
            id="mapY"
            name="mapY"
            type="number"
            min={0}
            max={1}
            step={0.01}
            placeholder="0.50"
          />
        </Field>
      </div>

      <SubmitButton />
    </form>
  );
}
