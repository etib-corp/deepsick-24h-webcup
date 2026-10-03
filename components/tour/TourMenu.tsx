"use client";

import Link from "next/link";
import { BookOpen, Compass, Play } from "lucide-react";

import { useTour } from "@/components/tour/TourProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { buttonClasses } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { accessibleLessons } from "@/lib/tour";
import { cn } from "@/lib/ui";

/**
 * Compact tutorial launcher for the personal spaces (console header): only the
 * lessons this role can actually run, plus a way into the written guide.
 */
export function TourMenu({ role, className }: { role?: string | null; className?: string }) {
  const t = useT();
  const { start, active } = useTour();
  const lessons = accessibleLessons(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t.tour.launchTitle}
          className={buttonClasses("ghost", "sm", className)}
        >
          <Compass className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {t.tour.launchTitle}
        </DropdownMenuLabel>

        {lessons.map((id) => (
          <DropdownMenuItem
            key={id}
            onSelect={() => start(id)}
            disabled={Boolean(active)}
            className={cn("gap-2")}
          >
            <Play className="size-3.5 shrink-0 text-primary" />
            <span className="flex-1 text-sm">{t.tour.lessons[id].label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/guide" className="gap-2">
            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm">{t.guide.title}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
