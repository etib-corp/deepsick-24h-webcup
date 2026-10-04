import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { buildActivityReport, isReportDays } from "@/lib/activity-report";
import { getActivityReportData } from "@/lib/activity-report-data";
import { buildCsv } from "@/lib/csv";
import { getDictionary } from "@/lib/i18n/server";
import { requireApiRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * F103 — CSV export of the synthetic activity report. Aggregated figures only
 * (per-domain trends + items needing attention), identical to the on-screen
 * report so the summary can be reused outside the console.
 */
export async function GET(request: Request) {
  const auth = await requireApiRole(["COUNCIL", "ADMIN_AGENT"]);
  if (auth.error) return authErrorResponse(auth.error);

  const t = getDictionary();
  const requested = new URL(request.url).searchParams.get("days");
  const days = isReportDays(requested) ? Number(requested) : 30;

  try {
    const data = await getActivityReportData({ days });
    const report = buildActivityReport(data.metrics, { days });

    const metricLabels = t.report.metrics as Record<string, string>;
    const attentionLabels = t.report.attentionItems as Record<string, string>;

    const columns = [t.report.csvIndicator, t.report.csvCurrent, t.report.csvPrevious, t.report.csvChange];
    const rows = [
      ...report.trends.map((trend) => [
        metricLabels[trend.key] ?? trend.key,
        trend.current,
        trend.previous,
        trend.change ?? "",
      ]),
      ...data.attention.map((item) => [attentionLabels[item.key] ?? item.key, item.count, "", ""]),
    ];

    const csv = buildCsv(columns, rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nova-terra-rapport-activite-${days}j-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: t.errors.exportFailed },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
