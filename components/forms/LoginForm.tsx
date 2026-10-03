"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Fingerprint, IdCard, LockKeyhole } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/client";
import { homeForRole } from "@/lib/roles";

export function LoginForm({ registered = false, deleted = false }: { registered?: boolean; deleted?: boolean }) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tabs = [
    { href: "/login", label: t.auth.loginTab, active: true },
    { href: "/register", label: t.auth.registerTab, active: false },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!result || result.error) {
      setError(t.auth.login.invalid);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t.auth.login.identifier} htmlFor="email">
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="AK-2048-TRN"
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

        <Button type="submit" disabled={pending} className="w-full">
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
        <p className="mt-0.5">{t.auth.demo.password}</p>
      </div>
    </div>
  );
}
