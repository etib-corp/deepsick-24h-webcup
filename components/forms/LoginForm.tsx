"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Fingerprint, IdCard, LockKeyhole } from "lucide-react";

import { BotGuardFields } from "@/components/forms/BotGuardFields";
import { BotGuardNotice } from "@/components/forms/BotGuardNotice";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  loginThrottleStatusAction,
} from "@/lib/actions/auth";
import { requestLoginCodeAction, startTwoStepAction } from "@/lib/actions/access";
import { BOT_TRAP_FIELD } from "@/lib/bot-fields";
import { format } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/client";
import { homeForRole } from "@/lib/roles";

/** D02 / F53 — the one-time code shown as a simulated secure transmission. */
type AccessStep = { code: string | null; expiresAtIso: string; simulated: boolean };

export function LoginForm({
  botToken,
  registered = false,
  deleted = false,
}: {
  botToken: string;
  registered?: boolean;
  deleted?: boolean;
}) {
  const t = useT();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  // "password" = classic sign-in (with an optional two-step code after it),
  // "code" = passwordless sign-in (D02).
  const [mode, setMode] = useState<"password" | "code">("password");
  const [step, setStep] = useState<"form" | "code">("form");
  const [accessStep, setAccessStep] = useState<AccessStep | null>(null);
  const [codeIdentifier, setCodeIdentifier] = useState("");
  // Kept for the final sign-in of the two-step flow (never rendered).
  const [keptPassword, setKeptPassword] = useState("");

  useEffect(() => {
    if (!lockedUntil) return;

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((lockedUntil - Date.now()) / 1000),
      );

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setLockedUntil(null);
      }
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = secondsLeft > 0;

  const tabs = [
    {
      href: "/login",
      label: t.auth.loginTab,
      active: true,
    },
    {
      href: "/register",
      label: t.auth.registerTab,
      active: false,
    },
  ];

  function startOver() {
    setStep("form");
    setAccessStep(null);
    setError(null);
  }

  function switchMode(next: "password" | "code") {
    setMode(next);
    startOver();
  }

  async function finishSignIn() {
    const session = await getSession();
    router.push(homeForRole(session?.user?.role));
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "");
    const password = String(formData.get("password") ?? "");
    const botWebsite = String(formData.get(BOT_TRAP_FIELD) ?? "");

    try {
      // Pre-login throttle check: clear feedback before hitting NextAuth.
      const throttle = await loginThrottleStatusAction({ identifier });
      if (throttle.locked) {
        setLockedUntil(Date.now() + throttle.retryAfterSeconds * 1000);
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
        // F81 — the signed challenge and honeypot travel with the credentials;
        // `authorize` refuses the attempt when they fail (and traces it).
        botToken,
        botWebsite,
      });

      if (!result || result.error) {
        if (result?.error === "BOT_GUARD_EXPIRED") {
          setError(t.errors.botExpired);
          return;
        }
        if (result?.error === "BOT_GUARD_BLOCKED") {
          setError(t.errors.botBlocked);
          return;
        }
        // F53 — the password was accepted but the account requires a second
        // step: request a fresh code and open the code step.
        if (result?.error === "TWO_STEP_REQUIRED") {
          const code = await startTwoStepAction({ identifier, password, botToken, botWebsite });
          if (!code.ok) {
            setError(code.message);
            return;
          }
          setCodeIdentifier(identifier);
          setKeptPassword(password);
          setAccessStep({
            code: code.code,
            expiresAtIso: code.expiresAtIso,
            simulated: code.simulated,
          });
          setStep("code");
          return;
        }
        // A failure may have just pushed us over the limit; surface it clearly.
        const after = await loginThrottleStatusAction({ identifier });
        if (after.locked) {
          setLockedUntil(Date.now() + after.retryAfterSeconds * 1000);
        } else {
          setError(t.auth.login.invalid);
        }
        return;
      }

      await finishSignIn();
    } catch {
      setError(t.auth.login.unavailable);
    } finally {
      setPending(false);
    }
  }

  /** D02 — ask for a one-time code instead of a password. */
  async function handleCodeRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "");
    const botWebsite = String(formData.get(BOT_TRAP_FIELD) ?? "");

    try {
      const result = await requestLoginCodeAction({ identifier, botToken, botWebsite });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCodeIdentifier(identifier);
      setKeptPassword("");
      setAccessStep({
        code: result.code,
        expiresAtIso: result.expiresAtIso,
        simulated: result.simulated,
      });
      setStep("code");
    } catch {
      setError(t.auth.login.unavailable);
    } finally {
      setPending(false);
    }
  }

  /** D02 / F53 — final sign-in with the one-time code. */
  async function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const code = String(formData.get("code") ?? "").trim();
    const botWebsite = String(formData.get(BOT_TRAP_FIELD) ?? "");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier: codeIdentifier,
        password: keptPassword,
        otp: code,
        otpMode: keptPassword ? "two-step" : "passwordless",
        botToken,
        botWebsite,
      });

      if (!result || result.error) {
        if (result?.error === "BOT_GUARD_EXPIRED") {
          setError(t.errors.botExpired);
          return;
        }
        if (result?.error === "BOT_GUARD_BLOCKED") {
          setError(t.errors.botBlocked);
          return;
        }
        const after = await loginThrottleStatusAction({ identifier: codeIdentifier });
        if (after.locked) {
          setLockedUntil(Date.now() + after.retryAfterSeconds * 1000);
          return;
        }
        setError(t.auth.login.codeInvalid);
        return;
      }

      await finishSignIn();
    } catch {
      setError(t.auth.login.unavailable);
    } finally {
      setPending(false);
    }
  }

  /** Sends a fresh code (expired or locked) without leaving the code step. */
  async function handleResend() {
    setPending(true);
    setError(null);
    try {
      const result = keptPassword
        ? await startTwoStepAction({
            identifier: codeIdentifier,
            password: keptPassword,
            botToken,
            botWebsite: "",
          })
        : await requestLoginCodeAction({ identifier: codeIdentifier, botToken, botWebsite: "" });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAccessStep({
        code: result.code,
        expiresAtIso: result.expiresAtIso,
        simulated: result.simulated,
      });
    } catch {
      setError(t.auth.login.unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--info)]/40 bg-[var(--info)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--info)]">
        {t.auth.secureAccess}
      </span>

      <header>
        <h1 className="font-mono text-2xl leading-tight text-foreground">
          {t.auth.login.title}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {t.auth.login.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-border p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md py-2 text-center font-mono text-xs uppercase tracking-wide transition ${
              tab.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* D02 — classic sign-in or passwordless one-time code */}
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => switchMode("password")}
          aria-pressed={mode === "password"}
          className={`rounded-md py-2 text-center font-mono text-[11px] uppercase tracking-wide transition ${
            mode === "password"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.auth.login.modePassword}
        </button>
        <button
          type="button"
          onClick={() => switchMode("code")}
          aria-pressed={mode === "code"}
          className={`rounded-md py-2 text-center font-mono text-[11px] uppercase tracking-wide transition ${
            mode === "code"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.auth.login.modeCode}
        </button>
      </div>

      {registered ? (
        <Alert tone="success">
          {t.auth.login.registered}
        </Alert>
      ) : null}

      {deleted ? (
        <Alert tone="success">
          {t.auth.login.deleted}
        </Alert>
      ) : null}

      {locked ? (
        <Alert tone="error">
          {format(t.auth.login.tooManyAttempts, {
            minutes: Math.max(
              1,
              Math.ceil(secondsLeft / 60),
            ),
          })}
        </Alert>
      ) : error ? (
        <Alert tone="error">
          {error}
        </Alert>
      ) : null}

      {step === "code" && accessStep ? (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <BotGuardFields form="login" token={botToken} />
          <header>
            <h2 className="font-mono text-lg text-foreground">
              {mode === "code" ? t.auth.login.codeTitle : t.auth.login.twoStepTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "code" ? t.auth.login.codeIntro : t.auth.login.twoStepHint}
            </p>
          </header>

          {accessStep.simulated && accessStep.code ? (
            <div className="rounded-lg border border-[var(--info)]/40 bg-[var(--info)]/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--info)]">
                📡 {t.auth.login.transmission}
              </p>
              <p className="mt-1 font-mono text-2xl tracking-[0.3em] text-foreground">
                {accessStep.code}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.auth.login.transmissionHint}
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              {t.auth.login.transmissionHint}
            </p>
          )}

          <Field label={t.auth.login.codeLabel} htmlFor="code" hint={t.auth.login.codeHint}>
            <Input
              id="code"
              name="code"
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              className="font-mono tracking-[0.3em]"
            />
          </Field>

          <Button type="submit" disabled={pending || locked} className="w-full">
            {pending ? t.auth.login.codeChecking : t.auth.login.codeSubmit}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={pending}
              className="text-primary underline-offset-4 hover:underline"
            >
              {t.auth.login.resend}
            </button>
            <button
              type="button"
              onClick={startOver}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              {mode === "code" ? t.auth.login.changeAccount : t.auth.login.backToPassword}
            </button>
          </div>
        </form>
      ) : mode === "code" ? (
        <form onSubmit={handleCodeRequest} className="space-y-4">
          <BotGuardFields form="login" token={botToken} />
          <p className="text-sm text-muted-foreground">{t.auth.login.codeIntro}</p>
          <Field
            label={t.auth.login.identifier}
            htmlFor="identifier-code"
            hint={t.auth.login.identifierHint}
          >
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="identifier-code"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="elodie.martin"
                className="pl-9"
              />
            </div>
          </Field>
          <Button type="submit" disabled={pending || locked} className="w-full">
            {pending ? t.auth.login.requesting : t.auth.login.requestCode}
          </Button>
          <BotGuardNotice />
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <BotGuardFields form="login" token={botToken} />
          <Field
            label={t.auth.login.identifier}
            htmlFor="identifier"
            hint={t.auth.login.identifierHint}
          >
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

        <Field
          label={t.auth.login.password}
          htmlFor="password"
        >
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
            <input
              type="checkbox"
              className="size-4 accent-primary"
            />

            {t.auth.login.trust}
          </label>
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--info)]">
            {t.auth.login.recover}
          </span>
        </div>

        <Button
          type="submit"
          disabled={pending || locked}
          className="w-full"
        >
          {pending
            ? t.auth.login.submitting
            : t.auth.login.submit}
        </Button>
        <BotGuardNotice />
      </form>
      )}
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t.auth.login.or}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled
      >
        <Fingerprint data-icon="inline-start" />
        {t.auth.login.biometric}
      </Button>
      <p className="rounded-lg border border-border bg-card p-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        {t.auth.login.session}
      </p>
      <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <p className="font-mono uppercase tracking-wide text-foreground">
          {t.auth.demo.title}
        </p>
        <p className="mt-1">
          citoyen@terranova.fr · securite@terranova.fr ·
          medical@terranova.fr · conseil@terranova.fr
        </p>
        <p className="mt-0.5">
          maintenance@ · transport@ · commerce@ ·
          administration@terranova.fr
        </p>
        <p className="mt-0.5">
          {t.auth.demo.noEmail}
        </p>
        <p className="mt-0.5">
          {t.auth.demo.password}
        </p>
      </div>
    </div>
  );
}