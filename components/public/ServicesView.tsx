"use client";

import { useState } from "react";

import { ColonyMap } from "@/components/colony/ColonyMap";
import { ServiceList } from "@/components/public/ServiceList";
import { useT } from "@/lib/i18n/client";
import type { MapService } from "@/lib/map-layout";
import { cn } from "@/lib/ui";

type View = "map" | "list";

export function ServicesView({ services }: { services: MapService[] }) {
  const t = useT();
  const [view, setView] = useState<View>("map");

  const nodes = services
    .filter((service) => service.mapped)
    .map((service) => ({
      id: service.id,
      label: service.name,
      icon: service.icon,
      sector: service.sector,
      description: service.description,
      featured: service.featured,
      x: service.x,
      y: service.y,
      href: `/services/${service.slug}`,
    }));

  const views: { id: View; label: string }[] = [
    { id: "map", label: t.publicPages.services.viewMap },
    { id: "list", label: t.publicPages.services.viewList },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {services.length} {t.publicPages.services.modules}
        </p>
        <div
          role="group"
          aria-label={t.publicPages.services.viewMap}
          className="inline-flex overflow-hidden rounded-md border border-border"
        >
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition",
                view === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div hidden={view !== "map"}>
        <ColonyMap
          nodes={nodes}
          label={t.publicPages.services.title}
          hint={t.publicPages.services.mapHint}
          ctaLabel={t.publicPages.services.consult}
        />
      </div>

      <div hidden={view !== "list"}>
        <ServiceList services={services} />
      </div>
    </div>
  );
}
