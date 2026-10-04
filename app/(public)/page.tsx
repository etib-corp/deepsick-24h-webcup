import Link from "next/link";

import { ColonyScene } from "@/components/colony/ColonyScene";
import { SectionHeader } from "@/components/colony/FeedRow";
import { Reveal } from "@/components/motion/Reveal";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { ReportStatusBadge } from "@/components/ui/StatusBadge";
import { colonyClock, COLONY_ARC, COLONY_POPULATION } from "@/lib/colony";
import { getPublishedAnnouncementSummaries, getPublishedServices } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { homeForRole, REPORT_STATUSES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const t = getDictionary();
  const [session, services, announcements] = await Promise.all([
    getAuthSession(),
    getPublishedServices(4),
    getPublishedAnnouncementSummaries(2),
  ]);

  const quickActions = [
    { href: "/citizen/report", icon: "⚠️", ...t.landing.actions.report },
    { href: "/citizen/orders", icon: "🚡", ...t.landing.actions.order },
    { href: "/services/demarches", icon: "📄", ...t.landing.actions.request },
    { href: "/announcements", icon: "📣", ...t.landing.actions.news },
  ];

  const spaceHref = session?.user ? homeForRole(session.user.role) : "/register";
  const featuredServices = services.slice(0, 4);
  const latestAnnouncements = announcements.slice(0, 2);

  return (
    <div>
      {/* Hero — mirrors the desktop frame of the ui-v1 design.
          The scene keeps a dark sky on every theme, so its copy uses the
          constant `scene-*` tokens instead of the theme's foreground/muted. */}
      <section className="relative border-b border-border">
        <ColonyScene className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col justify-between px-4 py-6">
          <Reveal self className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.3em]">
            <span className="text-scene-foreground">{t.common.appName}</span>
            <span className="text-scene-muted">{t.landing.os}</span>
          </Reveal>

          <Reveal className="max-w-2xl" stagger={120} y={16}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--scene-info)]/40 bg-[var(--scene-info)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--scene-info)]">
              {COLONY_ARC}
            </span>
            <h1 className="mt-4 font-mono text-3xl leading-tight text-scene-foreground md:text-5xl">
              {t.landing.title}
            </h1>
            <p className="mt-4 max-w-xl text-scene-muted">
              {format(t.landing.subtitle, { population: COLONY_POPULATION })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={spaceHref} className={buttonClasses("primary")}>
                {session?.user ? t.landing.ctaSpace : t.landing.ctaRegister}
              </Link>
              <Link href="/services" className={buttonClasses("secondary")} data-tour="hero-services">
                {t.landing.ctaServices}
              </Link>
            </div>
          </Reveal>

          <Reveal
            self
            delay={220}
            className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.2em] text-scene-muted"
          >
            <span>{colonyClock()}</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-[var(--scene-primary)]" />
              {t.common.colonyNominal}
            </span>
          </Reveal>
        </div>
      </section>

      {/* Interactive tutorials — only the lessons this visitor can actually run */}
      <section className="mx-auto max-w-6xl px-4 pb-10 py-10">
        <Card className="p-5">
          <TourLauncher onlyAccessible role={session?.user?.role ?? null} />
        </Card>
      </section>


      {/* Quick actions */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <SectionHeader title={t.landing.whatNext} />
        <Reveal stagger={70} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" dataTour="quick-actions">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card size="sm" className="h-full gap-2 p-4 transition hover:border-primary/50">
                <span aria-hidden className="text-xl">
                  {action.icon}
                </span>
                <p className="font-mono text-sm text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </Card>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <SectionHeader
          title={t.landing.civicNetwork}
          action={
            <Link href="/services" className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline">
              {t.landing.allServices}
            </Link>
          }
        />
        <Reveal stagger={70} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`}>
              <Card size="sm" className="h-full gap-2 p-4 transition hover:border-primary/50">
                <span aria-hidden className="text-xl">
                  {service.icon ?? "🏛️"}
                </span>
                <p className="font-mono text-sm text-foreground">{service.name}</p>
                <p className="line-clamp-3 text-xs text-muted-foreground">{service.description}</p>
              </Card>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Announcements */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <SectionHeader
          title={t.landing.latestNews}
          action={
            <Link href="/announcements" className="font-mono text-[11px] uppercase tracking-wide text-primary hover:underline">
              {t.landing.allNews}
            </Link>
          }
        />
        <Reveal stagger={90} className="grid gap-3 md:grid-cols-2">
          {latestAnnouncements.map((announcement) => (
            <Link key={announcement.id} href={`/announcements/${announcement.slug}`}>
              <Card size="sm" className="h-full gap-2 p-4 transition hover:border-primary/50">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {formatDate(announcement.publishedAt ?? announcement.createdAt)}
                </p>
                <p className="font-mono text-sm text-foreground">{announcement.title}</p>
                {announcement.excerpt ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{announcement.excerpt}</p>
                ) : null}
              </Card>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* Signalement lifecycle */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Card className="p-6">
          <SectionHeader title={t.landing.lifecycleTitle} />
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{t.landing.lifecycleText}</p>
          <ol className="flex flex-wrap items-center gap-2">
            {REPORT_STATUSES.map((status, index) => (
              <li key={status} className="flex items-center gap-2">
                <ReportStatusBadge status={status} />
                {index < REPORT_STATUSES.length - 1 ? (
                  <span className="text-muted-foreground" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}
