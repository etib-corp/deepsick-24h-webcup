import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { buildCsv } from "@/lib/csv";
import { getServiceIndex, getServiceVisitsSince } from "@/lib/data";
import { buildUsageReport, startOfUtcDay } from "@/lib/insights";
import { requireApiRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * F98 — CSV export of the service-usage report so the insight is reusable
 * outside the console (same figures as the on-screen report).
 */
export async function GET(request: Request) {
  const auth = await requireApiRole(["COUNCIL"]);
  if (auth.error) return authErrorResponse(auth.error);

  const days = new URL(request.url).searchParams.get("days") === "7" ? 7 : 30;

  try {
    const since = new Date(startOfUtcDay(new Date()).getTime() - days * 2 * 86_400_000);
    const [rows, services] = await Promise.all([getServiceVisitsSince(since), getServiceIndex()]);
    const report = buildUsageReport(rows, services, { days });

    const columns = [
      "Service",
      "Consultations",
      "Part (%)",
      "Période précédente",
      "Variation (%)",
    ];
    const rowsCsv = report.entries.map((entry) => [
      entry.name,
      entry.count,
      entry.share,
      entry.previous,
      entry.change ?? "",
    ]);

    const csv = buildCsv(columns, rowsCsv);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nova-terra-services-${days}j-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Export impossible." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
