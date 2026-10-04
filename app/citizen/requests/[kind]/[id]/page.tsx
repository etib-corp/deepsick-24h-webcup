import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";


import { RequestTrackingCard } from "@/components/colony/RequestTrackingCard";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { getCitizenRequestDetail } from "@/lib/request-tracking";

export default async function CitizenRequestDetailPage({ params }: { params: { kind: string; id: string } }) {
  const session = await requirePageRole(["CITIZEN"]);
  const item = await getCitizenRequestDetail(session.user.id, params.kind, params.id);
  if (!item) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs currentLabel={item.title} />
      <Link href="/citizen/requests" className="text-sm text-primary hover:underline">{getDictionary().citizen.tracking.back}</Link>
      <h1 className="font-mono text-xl">{getDictionary().citizen.tracking.detail}</h1>
      <RequestTrackingCard item={item} detail />
    </div>
  );
}
