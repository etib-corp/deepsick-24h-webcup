import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { buildCsv } from "@/lib/csv";
import { getStaffRequests } from "@/lib/data";
import { requireApiRole } from "@/lib/permissions";
import { REQUEST_PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** F88 — the columns other municipal services need for follow-up. */
const COLUMNS = [
  "Référence",
  "Sujet",
  "Catégorie",
  "Priorité",
  "Statut",
  "Demandeur",
  "Courriel",
  "Assigné",
  "Créée le",
  "Mise à jour le",
] as const;

function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

/**
 * F88 — staff export of the request tracking data.
 *
 * `scope=all` (default) exports every request; `scope=actionable` only the
 * ones still needing work. CSV is produced with a semicolon delimiter and a
 * UTF-8 BOM so it opens directly in spreadsheet tools, while ISO dates keep
 * it reusable by other services.
 */
export async function GET(request: Request) {
  const auth = await requireApiRole(["ADMIN_AGENT", "COUNCIL"]);
  if (auth.error) return authErrorResponse(auth.error);

  const scope =
    new URL(request.url).searchParams.get("scope") === "actionable" ? "actionable" : "all";

  try {
    const requests = await getStaffRequests({ actionable: scope === "actionable" });
    const rows = requests.map((item) => [
      item.reference,
      item.subject,
      item.category ?? "",
      label(REQUEST_PRIORITY_LABELS as Record<string, string>, item.priority),
      label(REQUEST_STATUS_LABELS as Record<string, string>, item.status),
      item.author?.name ?? "",
      item.author?.email ?? "",
      item.assignee?.name ?? "",
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    ]);

    const csv = buildCsv([...COLUMNS], rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nova-terra-demandes-${scope}-${stamp}.csv"`,
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
