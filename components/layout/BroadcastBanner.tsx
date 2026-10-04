import { BroadcastMessages } from "@/components/layout/BroadcastMessages";
import { getPublicBroadcasts } from "@/lib/actions/broadcasts";

/** Initial server rendering plus isolated updates for pages already open. */
export async function BroadcastBanner() {
  const result = await getPublicBroadcasts();

  return (
    <BroadcastMessages
      initialMessages={result.ok ? result.messages : []}
    />
  );
}