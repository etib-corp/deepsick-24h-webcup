import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { getOtherPublishedServices, getServiceBySlug } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);
  return { title: service?.name ?? getDictionary().publicPages.services.title };
}

export default async function ServiceDetailPage({ params }: Params) {
  const t = getDictionary();
  const service = await getServiceBySlug(params.slug);
  if (!service) notFound();

  const otherServices = await getOtherPublishedServices(service.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs currentLabel={service.name} />
      <Link href="/services" className="text-sm text-primary hover:underline">
        {t.publicPages.services.backAll}
      </Link>

      <header className="mt-6 flex items-start gap-4">
        <span className="text-4xl" aria-hidden>
          {service.icon ?? "🏛️"}
        </span>
        <div>
          {service.category ? (
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {service.category}
            </p>
          ) : null}
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-mono text-3xl text-foreground">
            {service.name}
            {!service.published ? (
              <Badge tone="danger">{t.publicPages.services.unavailableBadge}</Badge>
            ) : service.featured ? (
              <Badge tone="mars">{t.publicPages.services.featuredBadge}</Badge>
            ) : null}
          </h1>
        </div>
      </header>

      {!service.published ? (
        <Alert tone="error" title={t.publicPages.services.unavailableTitle} className="mt-6">
          {t.publicPages.services.unavailableBody}
        </Alert>
      ) : null}

      <p className="mt-6 whitespace-pre-line text-muted-foreground">{service.description}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {service.published ? (
          <>
            <Link href="/citizen/report" className={buttonClasses("primary")}>
              {t.publicPages.services.createRequest}
            </Link>
            <Link
              href={`/citizen/appointments/nouveau?service=${service.id}`}
              className={buttonClasses("secondary")}
            >
              {t.publicPages.services.bookAppointment}
            </Link>
          </>
        ) : null}
        <Link href="/contact" className={buttonClasses("secondary")}>
          {service.published
            ? t.publicPages.services.askQuestion
            : t.publicPages.services.unavailableAction}
        </Link>
      </div>

      {otherServices.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-sm uppercase tracking-wide text-primary">
            {t.publicPages.services.other}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {otherServices.map((item) => (
              <Link key={item.id} href={`/services/${item.slug}`}>
                <Card className="h-full transition hover:border-primary/50">
                  <h3 className="font-mono text-sm text-foreground">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
