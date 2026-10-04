import type { Metadata } from "next";

import { IncidentStation } from "@/components/colony/IncidentStation";
import { SecurityAlertsPanel } from "@/components/council/SecurityAlertsPanel";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().ops.security.title };
}

export default function SecurityConsolePage() {
  return (
    <div className="space-y-6">
      <IncidentStation type="SECURITY" />
      <SecurityAlertsPanel />
    </div>
  );
}
