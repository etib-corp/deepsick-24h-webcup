import type { Metadata } from "next";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { createFormToken } from "@/lib/bot-signals";
import { getDictionary } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  return { title: getDictionary().auth.registerTab };
}

export default function RegisterPage() {
  // F81 — minted per request (the auth layout reads cookies, so this page is
  // never statically cached with a stale challenge).
  return <RegisterForm botToken={createFormToken("register")} />;
}
