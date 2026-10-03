import { BroadcastCarousel } from "@/components/layout/BroadcastCarousel";
import { getActiveBroadcasts } from "@/lib/data";

/**
 * Site-wide banner for active general announcements. Rendered on the public
 * site and inside every console shell; shows nothing when no broadcast is
 * active or inside its scheduled time window. Multiple active broadcasts are
 * rotated in a carousel instead of stacked.
 */
export async function BroadcastBanner() {
  const broadcasts = await getActiveBroadcasts();
  if (broadcasts.length === 0) return null;

  return (
    <BroadcastCarousel
      items={broadcasts.map((broadcast) => ({
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        actionLabel: broadcast.actionLabel,
        actionHref: broadcast.actionHref,
      }))}
    />
  );
}
