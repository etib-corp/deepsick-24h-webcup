import type { Metadata } from "next";

import { LiteModeToggle } from "@/components/layout/LiteModeToggle";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/**
 * F57 — environmental performance of the platform: transparent estimation of
 * the transfer weight per page type, the measures already taken to stay
 * light, and the light-mode switch (F59/F62/F96).
 */

// Estimation constants (documented on the page — indicative orders of
// magnitude, not a full lifecycle analysis).
const ENERGY_KWH_PER_GB = 0.8; // end-to-end energy intensity, kWh per GB
const CO2_G_PER_KWH = 442; // average grid carbon intensity, gCO2e per kWh

const PAGES = [
  { key: "home", kb: 210 },
  { key: "services", kb: 240 },
  { key: "announcements", kb: 120 },
  { key: "contact", kb: 115 },
] as const;

/** Estimated carbon emissions for `views` visits of a page of `kb` kilobytes. */
function estimateCarbon(kb: number, views: number): number {
  const gb = (kb * views) / 1_000_000;
  return gb * ENERGY_KWH_PER_GB * CO2_G_PER_KWH;
}

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.eco.title };
}

export default function EcoPage() {
  const t = getDictionary();
  const copy = t.publicPages.eco;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Card className="p-4">
        <h2 className="font-mono text-sm text-foreground">{copy.estimateTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.estimateHint}</p>

        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 font-normal">{copy.page}</th>
              <th className="py-2 pr-3 font-normal">{copy.weight}</th>
              <th className="py-2 font-normal">{copy.co2}</th>
            </tr>
          </thead>
          <tbody>
            {PAGES.map((page) => (
              <tr key={page.key} className="border-t border-border/60">
                <td className="py-2 pr-3 text-foreground">{copy.pages[page.key]}</td>
                <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                  {page.kb} KB
                </td>
                <td className="py-2 font-mono text-xs text-muted-foreground">
                  {estimateCarbon(page.kb, 1000).toFixed(1)} gCO₂e / 1000
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-xs text-muted-foreground">{copy.method}</p>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-mono text-sm text-foreground">{copy.measuresTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {copy.measures.map((measure) => (
            <li key={measure}>{measure}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-mono text-sm text-foreground">{copy.liteTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.liteBody}</p>
        <div className="mt-3">
          <LiteModeToggle />
        </div>
      </Card>
    </div>
  );
}
