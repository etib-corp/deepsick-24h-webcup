import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "@/components/shadcn/sonner";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { TourProvider } from "@/components/tour/TourProvider";
import { LocaleProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { DEFAULT_THEME, THEME_IDS } from "@/lib/themes";

export function generateMetadata(): Metadata {
  const t = getDictionary();
  return {
    title: { default: t.meta.title, template: `%s · ${t.common.appName}` },
    description: t.meta.description,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME}
          themes={THEME_IDS}
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
          storageKey="nt-theme"
        >
          <LocaleProvider locale={locale} dictionary={dictionary}>
            <TooltipProvider>
              <TourProvider>
                {children}
                <Toaster />
              </TourProvider>
            </TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
