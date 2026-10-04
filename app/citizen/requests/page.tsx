import type { Metadata } from "next";
import Link from "next/link";

import { RequestTrackingCard } from "@/components/colony/RequestTrackingCard";
import { EmptyState } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { getCitizenRequestTracking, type TrackingKind } from "@/lib/request-tracking";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.tracking.title };
}

/** F79 — the five categories the tracking list can be filtered by. */
const KIND_IDS: readonly TrackingKind[] = ["request", "report", "order", "appointment", "contact"];

function chipClass(active: boolean): string {
  return active
    ? "rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-primary"
    : "rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition hover:text-foreground";
}

export default async function CitizenRequestTrackingPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const items = await getCitizenRequestTracking(session.user.id);

  const active =
    typeof searchParams.type === "string" &&
    (KIND_IDS as readonly string[]).includes(searchParams.type)
      ? (searchParams.type as TrackingKind)
      : null;
  const visible = active ? items.filter((item) => item.kind === active) : items;
  const countFor = (kind: TrackingKind) => items.filter((item) => item.kind === kind).length;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl">{t.citizen.tracking.title}</h1>
          <p className="text-sm text-muted-foreground">{t.citizen.tracking.subtitle}</p>
          <p className="mt-2 text-sm">{format(t.citizen.tracking.count, { count: visible.length })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/api/citizen/recap" download className={buttonClasses("secondary", "sm")}>
            {t.citizen.recap.download}
          </a>
          <Link href="/citizen/report" className={buttonClasses("primary", "sm")}>{t.citizen.reports.new}</Link>
        </div>
      </header>

      <nav aria-label={t.citizen.tracking.filterLabel} className="flex flex-wrap gap-2">
        <Link
          href="/citizen/requests"
          aria-current={active === null ? "page" : undefined}
          className={chipClass(active === null)}
        >
          {t.citizen.tracking.allKinds} · {items.length}
        </Link>
        {KIND_IDS.map((kind) => (
          <Link
            key={kind}
            href={`/citizen/requests?type=${kind}`}
            aria-current={active === kind ? "page" : undefined}
            className={chipClass(active === kind)}
          >
            {t.citizen.tracking.kinds[kind]} · {countFor(kind)}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <EmptyState title={t.citizen.tracking.empty} description={t.citizen.tracking.emptyHint} />
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((item) => <li key={`${item.kind}-${item.id}`}><RequestTrackingCard item={item} /></li>)}
        </ul>
      )}
    </div>
  );
}
