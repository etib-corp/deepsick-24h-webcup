import type { Metadata } from "next";

import { ColonyMap } from "@/components/colony/ColonyMap";
import { SectionHeader } from "@/components/colony/FeedRow";
import { Card } from "@/components/ui/Card";
import { getPublishedServices } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { buildMapServices } from "@/lib/map-layout";
import { requirePageRole } from "@/lib/permissions";
import { COLONY_SECTORS } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.map.title };
}

export default async function CitizenMapPage() {
  const t = getDictionary();
  await requirePageRole(["CITIZEN"]);

  const services = buildMapServices(await getPublishedServices());
  const nodes = services
    .filter((service) => service.mapped)
    .map((service) => ({
      id: service.id,
      label: service.name,
      icon: service.icon,
      sector: service.sector,
      description: service.description,
      openingHours: service.openingHours,
      x: service.x,
      y: service.y,
      href: `/services/${service.slug}`,
    }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.map.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.map.subtitle}</p>
      </header>

      <ColonyMap
        nodes={nodes}
        label={t.citizen.map.title}
        hint={t.publicPages.services.mapHint}
        ctaLabel={t.publicPages.services.consult}
      />

      <Card className="p-4">
        <SectionHeader title={t.citizen.map.sectors} />
        <ul className="grid gap-2 sm:grid-cols-2">
          {COLONY_SECTORS.map((sector) => (
            <li
              key={sector}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs text-foreground"
            >
              <span className="inline-block size-1.5 rounded-full bg-[var(--info)]" />
              {sector}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
