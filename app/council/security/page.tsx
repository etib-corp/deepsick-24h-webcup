import type { Metadata } from "next";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { StatTile } from "@/components/colony/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getUsers } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import {
  getSecurityEvents,
  getSecurityStats,
  isSecurityEventType,
  isSecurityOutcome,
  type SecurityOutcome,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.security.title };
}

const OUTCOME_TONES: Record<SecurityOutcome, "info" | "success" | "danger" | "warning"> = {
  INFO: "info",
  SUCCESS: "success",
  DENIED: "danger",
  FLAGGED: "warning",
};

/**
 * F69 — security audit console. The High Council reviews every recorded
 * sensitive operation (sign-in failures/blocks, denied access, role and
 * content changes, workflow transitions, neutralised inputs).
 */
export default async function CouncilSecurityPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);

  const [stats, events, users] = await Promise.all([
    getSecurityStats(),
    getSecurityEvents(60),
    getUsers(),
  ]);
  const nameById = new Map(users.map((user) => [user.id, user.name ?? user.email]));

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.council.station}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.council.security.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.security.subtitle}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label={t.council.security.blocked}
          value={stats.blocked}
          hint={t.council.security.blockedHint}
          tone="danger"
        />
        <StatTile
          label={t.council.security.denied}
          value={stats.denied}
          hint={t.council.security.deniedHint}
          tone="warning"
        />
        <StatTile
          label={t.council.security.neutralized}
          value={stats.neutralized}
          hint={t.council.security.neutralizedHint}
          tone="info"
        />
        <StatTile
          label={t.council.security.formBlocked}
          value={stats.formBlocked}
          hint={t.council.security.formBlockedHint}
          tone="warning"
        />
        <StatTile
          label={t.council.security.traced}
          value={stats.traced}
          hint={t.council.security.tracedHint}
          tone="success"
        />
      </div>

      <section>
        <SectionHeader
          title={t.council.security.recent}
          badge={<span className="font-mono text-[11px] text-muted-foreground">{events.length}</span>}
        />
        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t.council.security.empty}
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const actor = event.actorId
                ? nameById.get(event.actorId) ?? event.actorRole ?? t.common.none
                : t.council.security.system;
              const meta = [event.detail, actor, event.ip, formatDateTime(event.createdAt)]
                .filter(Boolean)
                .join(" · ");

              return (
                <FeedRow
                  key={event.id}
                  icon="🛡️"
                  title={
                    isSecurityEventType(event.type)
                      ? t.council.security.eventTypes[event.type]
                      : event.type
                  }
                  meta={meta}
                  trailing={
                    <Badge tone={isSecurityOutcome(event.outcome) ? OUTCOME_TONES[event.outcome] : "neutral"}>
                      {isSecurityOutcome(event.outcome)
                        ? t.council.security.outcomes[event.outcome]
                        : event.outcome}
                    </Badge>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">{t.council.security.logNote}</p>
      </Card>
    </div>
  );
}
