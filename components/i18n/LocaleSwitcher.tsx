"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { buttonClasses } from "@/components/ui/Button";
import { setLocaleCookie, useLocale, useT } from "@/lib/i18n/client";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

/** Language chooser (fr / en / es) — stores the locale in a cookie. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    setLocaleCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.common.language}
          className={buttonClasses("ghost", "sm", className)}
          data-pending={pending || undefined}
        >
          <Languages className="size-4" />
          <span className="font-mono text-[10px] uppercase">{LOCALE_LABELS[locale].short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => choose(value as Locale)}>
          {LOCALES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <span className="w-6 font-mono text-[10px] uppercase text-muted-foreground">
                {LOCALE_LABELS[value].short}
              </span>
              <span className="flex-1 text-sm">{LOCALE_LABELS[value].label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
