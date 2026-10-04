import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PlainExplanation } from "@/components/ui/PlainExplanation";
import { ServiceFeedbackForm } from "@/components/public/ServiceFeedbackForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  getFeedbackByAuthorAndService,
  getFeedbacksByService,
  getOtherPublishedServices,
  getServiceBySlug,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";

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

  // F76 — public comments; the form is shown to signed-in citizens only.
  const feedbacks = await getFeedbacksByService(service.id);
  const session = await getAuthSession();
  const myFeedback =
    session?.user?.role === "CITIZEN"
      ? await getFeedbackByAuthorAndService(service.id, session.user.id)
      : null;

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

      {service.plainLanguage ? (
        <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
            {t.publicPages.services.plainTitle}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {service.plainLanguage}
          </p>
        </div>
      ) : null}

      {service.openingHours || service.address ? (
        <dl className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {service.openingHours ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-foreground/70">
                {t.publicPages.services.hours}
              </dt>
              <dd className="mt-0.5">{service.openingHours}</dd>
            </div>
          ) : null}
          {service.address ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-foreground/70">
                {t.publicPages.services.address}
              </dt>
              <dd className="mt-0.5">{service.address}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

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

      <PlainExplanation title={t.plain.serviceRequest.title} className="mt-6">
        {t.plain.serviceRequest.body}
      </PlainExplanation>

      {service.slug === "transport" ? (
        <p className="mt-4 text-sm">
          <Link href="/transport" className="text-primary underline-offset-4 hover:underline">
            {t.publicPages.transport.link}
          </Link>
        </p>
      ) : null}

      <section className="mt-10" aria-labelledby="service-feedback-title">
        <h2
          id="service-feedback-title"
          className="font-mono text-sm uppercase tracking-wide text-primary"
        >
          {t.publicPages.services.feedback.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.publicPages.services.feedback.hint}
        </p>

        {session?.user?.role === "CITIZEN" ? (
          <Card className="mt-4 p-4">
            <ServiceFeedbackForm
              serviceId={service.id}
              initialComment={myFeedback?.comment ?? ""}
            />
          </Card>
        ) : (
          <p className="mt-3 text-sm">
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              {t.publicPages.services.feedback.login}
            </Link>
          </p>
        )}

        {feedbacks.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {feedbacks.map((feedback) => (
              <li key={feedback.id}>
                <Card className="p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {feedback.author?.name ?? t.common.colon} · {formatDate(feedback.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {feedback.comment}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {t.publicPages.services.feedback.empty}
          </p>
        )}
      </section>

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
