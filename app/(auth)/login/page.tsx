import type { Metadata } from "next";

import { LoginForm } from "@/components/forms/LoginForm";
import { createFormToken } from "@/lib/bot-signals";
import { getDictionary } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  return { title: getDictionary().auth.loginTab };
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { inscription?: string; deleted?: string };
}) {
  return (
    <LoginForm
      // F81 — minted per request (the auth layout reads cookies, so this page
      // is never statically cached with a stale challenge).
      botToken={createFormToken("login")}
      registered={searchParams.inscription === "1"}
      deleted={searchParams.deleted === "1"}
    />
  );
}
