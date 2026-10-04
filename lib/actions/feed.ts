"use server";

import { isAlertLive, sortAlertsBySeverity } from "@/lib/alerts";
import { getPublicBroadcasts, type PublicBroadcast } from "@/lib/actions/broadcasts";
import { getActiveColonyAlerts } from "@/lib/data";

/** F101 — public alert shape pushed to the banner and the /alertes page. */
export type PublicAlert = {
  id: string;
  title: string;
  sector: string | null;
  severity: string;
  situation: string;
  instructions: string;
  startsAtIso: string | null;
};

export type PublicFeed =
  | { ok: true; messages: PublicBroadcast[]; alerts: PublicAlert[] }
  | { ok: false };

/**
 * One round-trip for the site-wide banner: active broadcasts **and** live
 * colony alerts. Reusing the existing broadcast polling means alerts appear
 * within seconds everywhere without adding a second polling channel (F95).
 */
export async function getPublicFeed(): Promise<PublicFeed> {
  try {
    const [broadcasts, alerts] = await Promise.all([
      getPublicBroadcasts(),
      getActiveColonyAlerts(),
    ]);
    const live = sortAlertsBySeverity(alerts.filter((alert) => isAlertLive(alert)));

    return {
      ok: true,
      messages: broadcasts.ok ? broadcasts.messages : [],
      alerts: live.map((alert) => ({
        id: alert.id,
        title: alert.title,
        sector: alert.sector,
        severity: alert.severity,
        situation: alert.situation,
        instructions: alert.instructions,
        startsAtIso: alert.startsAt?.toISOString() ?? null,
      })),
    };
  } catch {
    return { ok: false };
  }
}
