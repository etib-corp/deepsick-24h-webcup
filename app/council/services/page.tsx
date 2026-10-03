import type { Metadata } from "next";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { ServiceForm } from "@/components/colony/ServiceForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteServiceAction, toggleServiceFeaturedAction } from "@/lib/actions/admin";
import { getAllServices } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.services.title };
}

export default async function CouncilServicesPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const services = await getAllServices();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.services.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.services.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.3fr]">
        <Card className="p-4">
          <SectionHeader title={t.council.services.new} />
          <ServiceForm />
        </Card>

        <section>
          <SectionHeader
            title={t.council.services.existing}
            badge={<span className="font-mono text-[11px] text-muted-foreground">{services.length}</span>}
          />
          <div className="space-y-2">
            {services.map((service) => (
              <Card key={service.id} className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FeedRow
                    className="flex-1 border-0 bg-transparent p-0"
                    icon={service.icon ?? "🏛️"}
                    title={service.name}
                    meta={`/${service.slug} · ${formatDate(service.createdAt)}`}
                    trailing={
                      service.featured ? (
                        <Badge tone="mars">{t.council.services.featured}</Badge>
                      ) : null
                    }
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={toggleServiceFeaturedAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <input
                        type="hidden"
                        name="featured"
                        value={service.featured ? "false" : "true"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {service.featured ? t.council.services.unfeature : t.council.services.feature}
                      </Button>
                    </form>
                    <form action={deleteServiceAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <Button type="submit" variant="danger" size="sm">
                        {t.council.services.remove}
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
