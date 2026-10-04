import type { Metadata } from "next";

import { DataExportCard } from "@/components/forms/DataExportCard";
import { DeleteAccountForm } from "@/components/forms/DeleteAccountForm";
import { TwoFactorCard } from "@/components/forms/TwoFactorCard";
import { Card } from "@/components/ui/Card";
import { getCitizenDataCounts } from "@/lib/data-export";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.account.title };
}

export default async function CitizenAccountPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const exportSections = await getCitizenDataCounts(session.user.id, t);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.citizen.account.title}</h1>
        <p className="text-sm text-muted-foreground">{t.citizen.account.subtitle}</p>
      </header>

      <Card className="space-y-2 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.citizen.account.identity}
        </p>
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">{t.citizen.account.email}</dt>
            <dd className="font-mono text-foreground">{session.user.email}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">{t.citizen.account.role}</dt>
            <dd className="font-mono text-foreground">{t.roles.CITIZEN}</dd>
          </div>
        </dl>
      </Card>

      <DataExportCard sections={exportSections} />

      <TwoFactorCard enabled={user?.twoFactorEnabled ?? false} />

      <Card className="space-y-3 border-destructive/40 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
          {t.citizen.account.dangerZone}
        </p>
        <p className="text-sm text-muted-foreground">{t.citizen.account.dangerZoneHint}</p>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
