"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { BotGuardFields } from "@/components/forms/BotGuardFields";
import { BotGuardNotice } from "@/components/forms/BotGuardNotice";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { registerAction } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.auth.register.submitting : t.auth.register.submit}
    </Button>
  );
}

export function RegisterForm({ botToken }: { botToken: string }) {
  const t = useT();
  const [state, formAction] = useFormState(registerAction, initialActionState);

  const tabs = [
    { href: "/login", label: t.auth.loginTab, active: false },
    { href: "/register", label: t.auth.registerTab, active: true },
  ];

  return (
    <div className="space-y-5">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--info)]/40 bg-[var(--info)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--info)]">
        {t.auth.newIdentity}
      </span>

      <header>
        <h1 className="font-mono text-2xl leading-tight text-foreground">{t.auth.register.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.register.subtitle}</p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-border p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md py-2 text-center font-mono text-xs uppercase tracking-wide transition ${
              tab.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <form action={formAction} className="space-y-4">
        <BotGuardFields form="register" token={botToken} />
        <Field label={t.auth.register.name} htmlFor="name">
          <Input id="name" name="name" required minLength={2} autoComplete="name" />
        </Field>

        <Field label={t.auth.register.email} htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>

        <Field
          label={t.auth.register.password}
          htmlFor="password"
          hint={t.auth.register.passwordHint}
        >
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>

        <SubmitButton />
        <BotGuardNotice />
      </form>

      <p className="text-sm text-muted-foreground">
        {t.auth.register.haveAccount}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t.auth.register.signIn}
        </Link>
      </p>
    </div>
  );
}
