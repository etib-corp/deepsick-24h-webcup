import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getActiveTransitDisruptions } from "@/lib/data";
import { format, getDictionary } from "@/lib/i18n/server";
import { isDisruptionLive, isLineRunning, nextDepartures, TRANSIT_LINES } from "@/lib/transit";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.transport.title };
}

/**
 * F36 — public transport information: shuttle lines, stops, frequencies and
 * the next departures, all readable on a single screen with a direct booking
 * action.
 *
 * F97 — live interruptions appear on the concerned line with the replacement
 * solution to use while they last.
 */
export default async function TransportPage() {
  const t = getDictionary();
  const now = new Date();

  const liveDisruptions = (await getActiveTransitDisruptions()).filter((disruption) =>
    isDisruptionLive(disruption, now),
  );
  const affectedLineIds = new Set(liveDisruptions.map((disruption) => disruption.lineId));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        title={t.publicPages.transport.title}
        description={t.publicPages.transport.subtitle}
      />

      {liveDisruptions.length > 0 ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {format(t.disruptions.publicAlert, { count: affectedLineIds.size })}
        </p>
      ) : null}

      <div className="space-y-4">
        {TRANSIT_LINES.map((line) => {
          const running = isLineRunning(line, now);
          const departures = nextDepartures(line, 3, now);
          const disruptions = liveDisruptions.filter(
            (disruption) => disruption.lineId === line.id,
          );
          return (
            <Card key={line.id} id={line.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-mono text-sm text-foreground">{line.name}</h2>
                <Badge tone={running ? "success" : "neutral"}>
                  {running
                    ? t.publicPages.transport.running
                    : t.publicPages.transport.stopped}
                </Badge>
              </div>

              {disruptions.map((disruption) => {
                const alternativeLine = TRANSIT_LINES.find(
                  (entry) => entry.id === disruption.alternativeLineId,
                );
                return (
                  <div
                    key={disruption.id}
                    role="alert"
                    className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
                      {t.disruptions.interrupted}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {disruption.title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {disruption.message}
                    </p>
                    <p className="mt-2 rounded-md bg-background/60 p-2 text-sm text-foreground">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        {t.disruptions.alternative}
                      </span>
                      <br />
                      {disruption.alternative}
                      {alternativeLine ? (
                        <>
                          {" "}
                          <Link
                            href={`#${alternativeLine.id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {alternativeLine.name}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                );
              })}

              <p className="mt-1 text-xs text-muted-foreground">
                {line.service} · {t.publicPages.transport.frequency} : {line.frequencyMinutes} min
              </p>

              <ol className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                {line.stops.map((stop, index) => (
                  <li key={`${line.id}-${index}`} className="flex items-center gap-1.5">
                    {index > 0 ? (
                      <span aria-hidden className="text-muted-foreground/50">
                        →
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                      {stop}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.publicPages.transport.next}
                </p>
                {departures.length > 0 ? (
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {departures.map((time) => (
                      <span
                        key={time}
                        className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                      >
                        {time}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.publicPages.transport.finished}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {t.publicPages.transport.tip}{" "}
        <Link href="/citizen/orders" className="text-primary underline-offset-4 hover:underline">
          {t.publicPages.transport.book}
        </Link>
      </p>
    </div>
  );
}
