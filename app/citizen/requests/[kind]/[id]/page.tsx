import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";


import { RequestTrackingCard } from "@/components/colony/RequestTrackingCard";
import { PlainExplanation } from "@/components/ui/PlainExplanation";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { getCitizenRequestDetail } from "@/lib/request-tracking";

export default async function CitizenRequestDetailPage({ params }: { params: { kind: string; id: string } }) {
  const session = await requirePageRole(["CITIZEN"]);
  const item = await getCitizenRequestDetail(session.user.id, params.kind, params.id);
  if (!item) notFound();
  const t = getDictionary();

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs currentLabel={item.title} />
      <Link href="/citizen/requests" className="text-sm text-primary hover:underline">{t.citizen.tracking.back}</Link>
      <h1 className="font-mono text-xl">{t.citizen.tracking.detail}</h1>
      <PlainExplanation title={t.plain.statuses.title}>{t.plain.statuses.body}</PlainExplanation>
      <RequestTrackingCard item={item} detail />
    </div>
  );
}
