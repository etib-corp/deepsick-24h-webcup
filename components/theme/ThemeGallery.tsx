"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";

import { ThemeSwatch } from "@/components/layout/ThemePicker";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/ui";

/** Full theme gallery — each card applies the theme on click. */
export function ThemeGallery() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const active = mounted ? theme : undefined;
  const copy = t.themes as Record<string, { label: string; description: string }>;

  return (
    <Reveal stagger={80} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((candidate) => {
        const isActive = active === candidate.id;
        const item = copy[candidate.id] ?? {
          label: candidate.label,
          description: candidate.description,
        };
        return (
          <Card
            key={candidate.id}
            className={cn("flex flex-col gap-4", isActive && "border-primary ring-2 ring-primary/30")}
          >
            <ThemeSwatch theme={candidate} className="h-24" />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm text-foreground">{item.label}</h2>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {candidate.scheme === "dark" ? t.common.dark : t.common.light}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>

            <Button
              type="button"
              aria-label={`${isActive ? t.common.activeTheme : t.common.apply} : ${item.label}`}
              size="sm"
              variant={isActive ? "secondary" : "primary"}
              disabled={isActive}
              onClick={() => setTheme(candidate.id)}
            >
              {isActive ? (
                <>
                  <Check data-icon="inline-start" />
                  {t.common.activeTheme}
                </>
              ) : (
                t.common.apply
              )}
            </Button>
          </Card>
        );
      })}
    </Reveal>
  );
}
