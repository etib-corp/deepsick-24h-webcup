import { IncidentConsole } from "@/components/colony/IncidentConsole";
import { getIncidentReports } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { toReportRow } from "@/lib/serialize";
import type { ReportType } from "@/lib/roles";

/** In-world station names stay untranslated. */
const STATIONS: Record<ReportType, string> = {
  SECURITY: "ARES SECURITY COMMAND",
  MEDICAL: "ASCLEPIUS MEDICAL NET",
  MAINTENANCE: "HEPHAESTUS INFRASTRUCTURE",
  CLEANLINESS: "HEPHAESTUS INFRASTRUCTURE",
};

const ROLES: Record<ReportType, string> = {
  SECURITY: "SECURITY",
  MEDICAL: "MEDIC",
  MAINTENANCE: "MAINTENANCE",
  CLEANLINESS: "MAINTENANCE",
};

/** Server wrapper shared by the security / medical / maintenance consoles. */
export async function IncidentStation({ type }: { type: ReportType }) {
  const t = getDictionary();
  await requirePageRole([ROLES[type], "COUNCIL"]);

  const reports = await getIncidentReports(
    type === "MAINTENANCE" ? ["MAINTENANCE", "CLEANLINESS"] : [type],
  );

  const copy =
    type === "SECURITY"
      ? t.ops.security
      : type === "MEDICAL"
        ? t.ops.medical
        : type === "CLEANLINESS"
          ? t.ops.cleanliness
          : t.ops.maintenance;

  return (
    <IncidentConsole
      station={STATIONS[type]}
      title={copy.title}
      subtitle={copy.subtitle}
      reports={reports.map(toReportRow)}
      detailBase={`/operations/${type === "MEDICAL" ? "medical" : type === "SECURITY" ? "security" : "maintenance"}`}
    />
  );
}
