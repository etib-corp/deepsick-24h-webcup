"use server";

import { getActiveBroadcasts } from "@/lib/data";

export type PublicBroadcast = {
  id: string;
  title: string;
  message: string;
  actionLabel: string | null;
  actionHref: string | null;
};

/** Read-only: broadcasts already appear publicly, without a signed-in session. */
export async function getPublicBroadcasts(): Promise<
  { ok: true; messages: PublicBroadcast[] } | { ok: false }
> {
  try {
    const broadcasts = await getActiveBroadcasts();
    return {
      ok: true,
      messages: broadcasts.map(({ id, title, message, actionLabel, actionHref }) => ({
        id, title, message, actionLabel, actionHref,
      })),
    };
  } catch {
    return { ok: false };
  }
}
