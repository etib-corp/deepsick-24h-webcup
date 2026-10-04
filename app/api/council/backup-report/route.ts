import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { requireApiRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * F87 — downloadable backup verification report (JSON), so the verdict can be
 * archived or examined outside the Council console. `?id=` selects a specific
 * drill; without it, the latest one is served.
 */
export async function GET(request: Request) {
  const auth = await requireApiRole(["COUNCIL"]);
  if (auth.error) return authErrorResponse(auth.error);

  const id = new URL(request.url).searchParams.get("id");
  const check = id
    ? await prisma.backupCheck.findUnique({ where: { id } })
    : await prisma.backupCheck.findFirst({ orderBy: { createdAt: "desc" } });
  if (!check) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let datasets: unknown = [];
  try {
    datasets = JSON.parse(check.datasets);
  } catch {
    datasets = [];
  }

  const report = {
    kind: "terra-nova-backup-verification",
    generatedAt: check.createdAt.toISOString(),
    status: check.status,
    durationMs: check.durationMs,
    totalRows: check.totalRows,
    totalBytes: check.totalSize,
    datasets,
  };

  const day = check.createdAt.toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="verification-sauvegarde-${day}.json"`,
    },
  });
}
