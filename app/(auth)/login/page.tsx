import type { Metadata } from "next";

import { LoginForm } from "@/components/forms/LoginForm";
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
      registered={searchParams.inscription === "1"}
      deleted={searchParams.deleted === "1"}
    />
  );
}
