"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

/** A receipt replaces the form only after its server action has succeeded. */
export function SubmissionConfirmation({ message, reference, href, linkLabel }: {
  message: string;
  reference?: string;
  href: string;
  linkLabel: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <Alert autoFocus tone="success" title={t.submission.received}>
        <p>{message}</p>
        {reference ? (
          <p className="mt-2">{t.submission.reference} <span className="font-mono">{reference}</span></p>
        ) : null}
        <p className="mt-2">{t.submission.noResubmit}</p>
      </Alert>
      <Link href={href} className={buttonClasses("secondary", "sm", "self-start")}>
        {linkLabel}
      </Link>
    </div>
  );
}
