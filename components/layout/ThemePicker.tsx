"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Palette } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/ui";

/** Compact theme chooser for headers and shells. */
export function ThemePicker({ className }: { className?: string }) {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const active = mounted ? theme : undefined;
  const copy = t.themes as Record<string, { label: string; description: string }>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.common.theme}
          className={buttonClasses("ghost", "sm", className)}
        >
          <Palette data-icon="inline-start" />
          <span className="sr-only">{t.common.theme}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {t.common.theme}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={active ?? ""} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system" className="gap-3">
            <Monitor className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm">{t.common.system}</span>
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {THEMES.map((candidate) => {
            const item = copy[candidate.id] ?? {
              label: candidate.label,
              description: candidate.description,
            };
            return (
              <DropdownMenuRadioItem
                key={candidate.id}
                value={candidate.id}
                className="gap-3"
              >
                <span
                  className="flex size-5 shrink-0 overflow-hidden rounded-sm border border-border"
                  aria-hidden
                >
                  <span className="h-full w-1/2" style={{ background: candidate.swatch.background }} />
                  <span className="h-full w-1/2" style={{ background: candidate.swatch.primary }} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{item.label}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Inline swatch preview reused by the appearance gallery. */
export function ThemeSwatch({
  theme,
  className,
}: {
  theme: (typeof THEMES)[number];
  className?: string;
}) {
  return (
    <span className={cn("flex overflow-hidden rounded-md border border-border", className)} aria-hidden>
      <span className="flex-1 p-3" style={{ background: theme.swatch.background }}>
        <span className="block h-2.5 w-12 rounded-sm" style={{ background: theme.swatch.primary }} />
        <span
          className="mt-2 block h-2 w-20 rounded-sm opacity-70"
          style={{ background: theme.swatch.card }}
        />
        <span
          className="mt-2 block h-2 w-14 rounded-sm opacity-50"
          style={{ background: theme.swatch.info }}
        />
      </span>
      <span className="w-14" style={{ background: theme.swatch.card }} />
    </span>
  );
}
