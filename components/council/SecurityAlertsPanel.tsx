import { SecurityAlertBoard, type SecurityAlertView } from "@/components/council/SecurityAlertBoard";
import { formatDateTime } from "@/lib/format";
import { requirePageRole } from "@/lib/permissions";
import { toSecurityAlertDto } from "@/lib/serialize";
import { getAlertStats, getSecurityAlerts, runSecurityScan } from "@/lib/sentinel";

/**
 * F85 — server wrapper: runs a (throttled) scan, then hands the graded alerts
 * to the live board. Available to the High Council and the security station.
 */
export async function SecurityAlertsPanel() {
  await requirePageRole(["SECURITY", "COUNCIL"]);
  await runSecurityScan();

  const [alerts, stats] = await Promise.all([getSecurityAlerts(60), getAlertStats()]);
  const view: SecurityAlertView[] = alerts.map((alert) => ({
    ...toSecurityAlertDto(alert),
    detectedLabel: formatDateTime(alert.detectedAt),
  }));

  return <SecurityAlertBoard alerts={view} stats={stats} />;
}
