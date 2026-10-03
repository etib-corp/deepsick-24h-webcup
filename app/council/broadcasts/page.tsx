import type { Metadata } from "next";

import { BroadcastForm } from "@/components/colony/BroadcastForm";
import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteBroadcastAction, toggleBroadcastAction } from "@/lib/actions/admin";
import { getAllBroadcasts } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.broadcasts.title };
}

export default async function CouncilBroadcastsPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const broadcasts = await getAllBroadcasts();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.broadcasts.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.broadcasts.subtitle}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr,1.3fr]">
        <Card className="p-4">
          <SectionHeader title={t.council.broadcasts.newBroadcast} />
          <BroadcastForm />
        </Card>

        <section>
          <SectionHeader
            title={t.council.broadcasts.list}
            badge={
              <span className="font-mono text-[11px] text-muted-foreground">{broadcasts.length}</span>
            }
          />
          <div className="space-y-2">
            {broadcasts.map((broadcast) => {
              const window =
                broadcast.startsAt || broadcast.endsAt
                  ? format(t.council.broadcasts.scheduled, {
                      start: formatDateTime(broadcast.startsAt),
                      end: formatDateTime(broadcast.endsAt),
                    })
                  : t.council.broadcasts.permanent;

              return (
                <Card key={broadcast.id} className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <FeedRow
                      className="flex-1 border-0 bg-transparent p-0"
                      title={broadcast.title}
                      meta={`${window} · ${broadcast.author?.name ?? t.common.none}`}
                    />
                    <div className="flex items-center gap-2">
                      <Badge tone={broadcast.active ? "warning" : "neutral"}>
                        {broadcast.active
                          ? t.council.broadcasts.active
                          : t.council.broadcasts.inactive}
                      </Badge>
                      <form action={toggleBroadcastAction}>
                        <input type="hidden" name="id" value={broadcast.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={broadcast.active ? "false" : "true"}
                        />
                        <Button type="submit" variant="secondary" size="sm">
                          {broadcast.active
                            ? t.council.broadcasts.inactive
                            : t.council.broadcasts.active}
                        </Button>
                      </form>
                      <form action={deleteBroadcastAction}>
                        <input type="hidden" name="id" value={broadcast.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          {t.council.broadcasts.delete}
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
