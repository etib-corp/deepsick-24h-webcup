"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";
import type { MapService } from "@/lib/map-layout";

function ServiceCard({ service, featured = false }: { service: MapService; featured?: boolean }) {
  const t = useT();
  const unavailable = !service.published;
  return (
    <Link key={service.id} href={`/services/${service.slug}`} className="group">
      <Card
        className={
          unavailable
            ? "h-full border-dashed border-warning/50 bg-card/60 opacity-80 transition group-hover:border-warning"
            : featured
              ? "h-full border-primary/40 bg-primary/5 transition group-hover:border-primary/70"
              : "h-full transition group-hover:border-primary/50"
        }
      >
        <div className="flex items-center gap-2">
          <span aria-hidden>{service.icon ?? "🏛️"}</span>
          <h3 className="font-mono text-sm text-foreground">{service.name}</h3>
          {unavailable ? (
            <Badge tone="danger">{t.publicPages.services.unavailableBadge}</Badge>
          ) : featured ? (
            <Badge tone="mars">{t.publicPages.services.featuredBadge}</Badge>
          ) : null}
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
          {service.description}
        </p>
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-primary opacity-0 transition group-hover:opacity-100">
          {t.publicPages.services.consult}
        </p>
      </Card>
    </Link>
  );
}

export function ServiceList({ services }: { services: MapService[] }) {
  const t = useT();

  const featured = services.filter((service) => service.featured);
  const rest = services.filter((service) => !service.featured);

  const categories = Array.from(
    rest.reduce((map, service) => {
      const key = service.category ?? t.publicPages.services.other;
      map.set(key, [...(map.get(key) ?? []), service]);
      return map;
    }, new Map<string, MapService[]>()),
  );

  return (
    <div className="space-y-10">
      {featured.length > 0 ? (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-primary">
            {t.publicPages.services.featured}
            <Badge tone="mars">{featured.length}</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section>
          {featured.length > 0 ? (
            <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-primary">
              {t.publicPages.services.allServices}
            </h2>
          ) : null}
          <div className="space-y-10">
            {categories.map(([category, items]) => (
              <section key={category}>
                <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-primary">
                  {category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
