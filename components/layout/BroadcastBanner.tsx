import { BroadcastMessages } from "@/components/layout/BroadcastMessages";
import { getPublicFeed } from "@/lib/actions/feed";

import type { PublicAlert } from "@/lib/actions/feed";
import type { PublicBroadcast } from "@/lib/actions/broadcasts";

/** Initial server rendering plus isolated updates for pages already open. */
export async function BroadcastBanner() {
  const feed = await getPublicFeed();

  const messages: PublicBroadcast[] = feed.ok ? feed.messages : [];
  const alerts: PublicAlert[] = feed.ok ? feed.alerts : [];

  return <BroadcastMessages initialMessages={messages} initialAlerts={alerts} />;
}