import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getActiveBroadcasts, getPublishedAnnouncementSummaries } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().publicPages.status.title };
}

/**
 * F94 — degraded mode: the essentials (contacts, current instructions, news
 * and direct links) stay readable even when part of the platform is down.
 * Every read is best-effort and falls back to the static content.
 */
export default async function StatusPage() {
  const t = getDictionary();
  const copy = t.publicPages.status;

  const [broadcasts, announcements] = await Promise.all([
    getActiveBroadcasts().catch(() => []),
    getPublishedAnnouncementSummaries(3).catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Card className="p-4">
        <h2 className="font-mono text-sm text-foreground">{copy.contactsTitle}</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {copy.contacts.map((contact) => (
            <li
              key={contact.label}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{contact.label}</span>
              <span className="font-mono text-foreground">{contact.number}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{copy.degradedNote}</p>
      </Card>

      {broadcasts.length > 0 ? (
        <Card className="mt-4 p-4">
          <h2 className="font-mono text-sm text-foreground">{copy.messagesTitle}</h2>
          <ul className="mt-2 space-y-2">
            {broadcasts.map((broadcast) => (
              <li key={broadcast.id} className="rounded-md border border-border px-3 py-2">
                <p className="text-sm text-foreground">{broadcast.title}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {broadcast.message}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {announcements.length > 0 ? (
        <Card className="mt-4 p-4">
          <h2 className="font-mono text-sm text-foreground">{copy.newsTitle}</h2>
          <ul className="mt-2 space-y-2">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="text-sm">
                <Link
                  href={`/announcements/${announcement.slug}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {announcement.title}
                </Link>
                {announcement.publishedAt ? (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {formatDate(announcement.publishedAt)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <nav aria-label={copy.title} className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/services" className="text-primary underline-offset-4 hover:underline">
          {t.nav.services}
        </Link>
        <Link href="/announcements" className="text-primary underline-offset-4 hover:underline">
          {t.nav.announcements}
        </Link>
        <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
          {t.nav.contact}
        </Link>
      </nav>
    </div>
  );
}
