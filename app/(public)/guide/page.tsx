import type { Metadata } from "next";

import { GuideExplorer } from "@/components/guide/GuideExplorer";
import { TourLauncher } from "@/components/tour/TourLauncher";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { isGuideProfileId, type GuideProfileId } from "@/lib/guide";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().guide.title };
}

export default async function GuidePage() {
  const t = getDictionary();
  const session = await getAuthSession();
  const role = session?.user?.role;

  // Signed-in visitors start on their own walkthrough, everyone else on the
  // visitor one.
  const defaultProfile: GuideProfileId = isGuideProfileId(role) ? role : "VISITOR";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <PageHeader title={t.guide.title} description={t.guide.subtitle} />
      <Card className="p-5">
        <TourLauncher role={role ?? null} />
      </Card>
      <GuideExplorer defaultProfile={defaultProfile} role={role ?? null} />
    </div>
  );
}
