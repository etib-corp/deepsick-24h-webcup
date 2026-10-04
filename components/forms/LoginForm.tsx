"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Fingerprint, IdCard, LockKeyhole } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { loginThrottleStatusAction } from "@/lib/actions/auth";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";
import { homeForRole } from "@/lib/roles";

export function LoginForm({ registered = false, deleted = false }: { registered?: boolean; deleted?: boolean }) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) setLockedUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = secondsLeft > 0;

  const tabs = [
    { href: "/login", label: t.auth.loginTab, active: true },
    { href: "/register", label: t.auth.registerTab, active: false },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");

    const throttle = await loginThrottleStatusAction({ identifier });
    if (throttle.locked) {
      setLockedUntil(Date.now() + throttle.retryAfterSeconds * 1000);
      setPending(false);
      return;
    }

    const result = await signIn("credentials", { redirect: false, identifier, password });

    if (!result || result.error) {
      // A failure may have just pushed us over the limit; surface it clearly.
      const after = await loginThrottleStatusAction({ identifier });
      if (after.locked) {
        setLockedUntil(Date.now() + after.retryAfterSeconds * 1000);
      } else {
        setError(t.auth.login.invalid);
      }
      setPending(false);
      return;
    }

    const session = await getSession();
    router.push(homeForRole(session?.user?.role));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--info)]/40 bg-[var(--info)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--info)]">
        {t.auth.secureAccess}
      </span>

      <header>
        <h1 className="font-mono text-2xl leading-tight text-foreground">{t.auth.login.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.login.subtitle}</p>
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

      {registered ? <Alert tone="success">{t.auth.login.registered}</Alert> : null}
      {deleted ? <Alert tone="success">{t.auth.login.deleted}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {locked ? (
        <Alert tone="error">
          {format(t.auth.login.tooManyAttempts, {
            minutes: Math.max(1, Math.ceil(secondsLeft / 60)),
          })}
        </Alert>
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t.auth.login.identifier} htmlFor="identifier" hint={t.auth.login.identifierHint}>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identifier"
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="elodie.martin"
              className="pl-9"
            />
          </div>
        </Field>

        <Field label={t.auth.login.password} htmlFor="password">
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••"
              className="pl-9"
            />
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" className="size-4 accent-primary" />
            {t.auth.login.trust}
          </label>
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--info)]">
            {t.auth.login.recover}
          </span>
        </div>

        <Button type="submit" disabled={pending || locked} className="w-full">
          {pending ? t.auth.login.submitting : t.auth.login.submit}
        </Button>
      </form>

      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t.auth.login.or}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="secondary" className="w-full" disabled>
        <Fingerprint data-icon="inline-start" />
        {t.auth.login.biometric}
      </Button>

      <p className="rounded-lg border border-border bg-card p-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {t.auth.login.session}
      </p>

      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <p className="font-mono uppercase tracking-wide text-foreground">{t.auth.demo.title}</p>
        <p className="mt-1">citoyen@terranova.fr · securite@terranova.fr · medical@terranova.fr · conseil@terranova.fr</p>
        <p className="mt-0.5">maintenance@ · transport@ · commerce@ · administration@terranova.fr</p>
        <p className="mt-0.5">{t.auth.demo.noEmail}</p>
        <p className="mt-0.5">{t.auth.demo.password}</p>
      </div>
    </div>
  );
}
