import type { Metadata } from "next";
import Link from "next/link";

import { RequestTrackingCard } from "@/components/colony/RequestTrackingCard";
import { EmptyState } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { getCitizenRequestTracking } from "@/lib/request-tracking";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.tracking.title };
}

export default async function CitizenRequestTrackingPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const items = await getCitizenRequestTracking(session.user.id);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl">{t.citizen.tracking.title}</h1>
          <p className="text-sm text-muted-foreground">{t.citizen.tracking.subtitle}</p>
          <p className="mt-2 text-sm">{format(t.citizen.tracking.count, { count: items.length })}</p>
        </div>
        <Link href="/citizen/report" className={buttonClasses("primary", "sm")}>{t.citizen.reports.new}</Link>
      </header>
      {items.length === 0 ? (
        <EmptyState title={t.citizen.tracking.empty} description={t.citizen.tracking.emptyHint} />
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => <li key={`${item.kind}-${item.id}`}><RequestTrackingCard item={item} /></li>)}
        </ul>
      )}
    </div>
  );
}
