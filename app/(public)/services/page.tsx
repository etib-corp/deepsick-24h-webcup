import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServicesView } from "@/components/public/ServicesView";
import { getPublishedServices } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { buildMapServices } from "@/lib/map-layout";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.services.title };
}

export default async function ServicesPage() {
  const t = getDictionary();
  const services = buildMapServices(await getPublishedServices());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title={t.publicPages.services.title}
        description={t.publicPages.services.subtitle}
      />

      {services.length === 0 ? (
        <EmptyState
          title={t.publicPages.services.empty}
          description={t.publicPages.services.emptyHint}
        />
      ) : (
        <ServicesView services={services} />
      )}
    </div>
  );
}
