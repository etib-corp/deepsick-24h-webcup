import type { Metadata } from "next";

import { ConsultationOpinions } from "@/components/colony/ConsultationOpinions";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.consultations.title };
}

export default async function CouncilConsultationPage({
  params,
}: {
  params: { id: string };
}) {
  await requirePageRole(["COUNCIL"]);
  return <ConsultationOpinions id={params.id} />;
}
