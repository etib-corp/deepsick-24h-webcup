import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublishedAnnouncementSummaries } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.announcements.title };
}

export default async function AnnouncementsPage() {
  const t = getDictionary();
  const announcements = await getPublishedAnnouncementSummaries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        title={t.publicPages.announcements.title}
        description={t.publicPages.announcements.subtitle}
      />

      {announcements.length === 0 ? (
        <EmptyState title={t.publicPages.announcements.empty} />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Link key={announcement.id} href={`/announcements/${announcement.slug}`}>
              <Card className="transition hover:border-primary/50">
                <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {formatDate(announcement.publishedAt ?? announcement.createdAt)}
                </p>
                <h2 className="mt-2 font-mono text-lg text-foreground">{announcement.title}</h2>
                {announcement.excerpt ? (
                  <p className="mt-2 text-sm text-muted-foreground">{announcement.excerpt}</p>
                ) : null}
                <p className="mt-3 font-mono text-xs uppercase tracking-wide text-primary">
                  {t.publicPages.announcements.read}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
