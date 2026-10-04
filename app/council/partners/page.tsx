import type { Metadata } from "next";

import { PartnerForm } from "@/components/colony/PartnerForm";
import { SectionHeader } from "@/components/colony/FeedRow";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deletePartnerAction, togglePartnerAction } from "@/lib/actions/partners";
import { getAllPartners } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { partnerAvailability } from "@/lib/partners";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().partners.councilTitle };
}

/** F99 — Council management of the external partner directory. */
export default async function CouncilPartnersPage() {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);
  const partners = await getAllPartners();
  const now = new Date();

  return (
    <div className="space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t.partners.councilEyebrow}
        </p>
        <h1 className="mt-1 font-mono text-xl text-foreground">{t.partners.councilTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.partners.councilSubtitle}</p>
      </header>

      <Card className="space-y-3 p-4">
        <SectionHeader title={t.partners.council.listTitle} />
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.partners.council.empty}</p>
        ) : (
          <ul className="space-y-2">
            {partners.map((partner) => {
              const availability = partnerAvailability(partner, now);
              return (
                <li
                  key={partner.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{partner.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      /partenaires · {partner.category ?? t.common.none}
                      {availability.opensAt && availability.closesAt
                        ? ` · ${availability.opensAt}–${availability.closesAt}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={partner.active ? "success" : "neutral"}>
                      {partner.active ? t.partners.council.active : t.partners.council.inactive}
                    </Badge>
                    <form action={togglePartnerAction}>
                      <input type="hidden" name="id" value={partner.id} />
                      <input type="hidden" name="active" value={partner.active ? "0" : "1"} />
                      <button type="submit" className={buttonClasses("secondary", "sm")}>
                        {partner.active
                          ? t.partners.council.deactivate
                          : t.partners.council.activate}
                      </button>
                    </form>
                    <form action={deletePartnerAction}>
                      <input type="hidden" name="id" value={partner.id} />
                      <button type="submit" className={buttonClasses("danger", "sm")}>
                        {t.partners.council.delete}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <SectionHeader title={t.partners.council.createTitle} />
        <PartnerForm />
      </Card>
    </div>
  );
}
