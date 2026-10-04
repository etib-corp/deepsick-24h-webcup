"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { IdCard, LifeBuoy, Mail } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { registerAction } from "@/lib/actions/auth";
import { suggestUsername } from "@/lib/identity";
import { useT } from "@/lib/i18n/client";

type RegisterMode = "email" | "identifier";

function SubmitButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? t.auth.register.submitting : t.auth.register.submit}
    </Button>
  );
}

export function RegisterForm() {
  const t = useT();
  const [state, formAction] = useFormState(registerAction, initialActionState);
  // New arrivals may have no email address (F71): they can pick a colon
  // identifier instead. Both inputs stay mounted so nothing typed is lost when
  // switching modes — the inactive one is simply disabled (and not submitted).
  const [mode, setMode] = useState<RegisterMode>("email");
  const nameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  // Once the resident edits the identifier themselves, stop suggesting.
  const usernameTouched = useRef(false);

  const tabs = [
    { href: "/login", label: t.auth.loginTab, active: false },
    { href: "/register", label: t.auth.registerTab, active: true },
  ];

  function chooseMode(next: RegisterMode) {
    if (
      next === "identifier" &&
      usernameRef.current &&
      !usernameTouched.current &&
      !usernameRef.current.value
    ) {
      usernameRef.current.value = suggestUsername(nameRef.current?.value ?? "");
    }
    setMode(next);
  }

  const modeButton = (value: RegisterMode, label: string, Icon: typeof Mail) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => chooseMode(value)}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center font-mono text-[11px] uppercase tracking-wide transition ${
        mode === value
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );

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
        <Field label={t.auth.register.name} htmlFor="name">
          <Input
            ref={nameRef}
            id="name"
            name="name"
            required
            minLength={2}
            autoComplete="name"
            onChange={(event) => {
              // No-email mode: keep the identifier in step with the name until
              // the resident edits the identifier themselves.
              if (mode === "identifier" && !usernameTouched.current && usernameRef.current) {
                usernameRef.current.value = suggestUsername(event.target.value);
              }
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          {modeButton("email", t.auth.register.modeEmail, Mail)}
          {modeButton("identifier", t.auth.register.modeIdentifier, IdCard)}
        </div>

        <div className={mode === "email" ? undefined : "hidden"}>
          <Field label={t.auth.register.email} htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required={mode === "email"}
              disabled={mode !== "email"}
              autoComplete="email"
            />
          </Field>
        </div>

        <div className={mode === "identifier" ? undefined : "hidden"}>
          <Field
            label={t.auth.register.identifier}
            htmlFor="username"
            hint={t.auth.register.identifierHint}
          >
            <Input
              ref={usernameRef}
              id="username"
              name="username"
              required={mode === "identifier"}
              disabled={mode !== "identifier"}
              autoComplete="username"
              onChange={() => {
                usernameTouched.current = true;
              }}
            />
          </Field>
        </div>

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
      </form>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <LifeBuoy className="size-4 text-[var(--info)]" aria-hidden />
        {t.auth.register.help}{" "}
        <Link href="/arrivants" className="text-primary hover:underline">
          {t.auth.register.helpLink}
        </Link>
      </p>

      <p className="text-sm text-muted-foreground">
        {t.auth.register.haveAccount}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t.auth.register.signIn}
        </Link>
      </p>
    </div>
  );
}
