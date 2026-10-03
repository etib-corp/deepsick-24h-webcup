import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

import { getAnnouncementBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const announcement = await getAnnouncementBySlug(params.slug);
  return { title: announcement?.title ?? getDictionary().publicPages.announcements.title };
}

export default async function AnnouncementDetailPage({ params }: Params) {
  const t = getDictionary();
  const announcement = await getAnnouncementBySlug(params.slug);
  if (!announcement || !announcement.published) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs currentLabel={announcement.title} />
      <Link href="/announcements" className="text-sm text-primary hover:underline">
        {t.publicPages.announcements.backAll}
      </Link>

      <header className="mt-6">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {formatDate(announcement.publishedAt ?? announcement.createdAt)}
          {announcement.author?.name ? ` · ${announcement.author.name}` : ""}
        </p>
        <h1 className="mt-2 font-mono text-3xl leading-tight text-foreground">
          {announcement.title}
        </h1>
        {announcement.excerpt ? (
          <p className="mt-4 text-lg text-muted-foreground">{announcement.excerpt}</p>
        ) : null}
      </header>

      <div className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">
        {announcement.body}
      </div>
    </article>
  );
}
