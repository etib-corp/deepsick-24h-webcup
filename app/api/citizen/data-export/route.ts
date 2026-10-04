import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { buildCitizenDataExport } from "@/lib/data-export";
import { getDictionary } from "@/lib/i18n/server";
import { requireApiRole } from "@/lib/permissions";
import { pushNotification } from "@/lib/services";

export const dynamic = "force-dynamic";

/**
 * Exports the authenticated citizen's personal data as reusable JSON.
 * Scoped to the session (no id parameter), so another citizen's export is
 * impossible. On failure a notification is recorded so the request always has
 * a follow-up.
 */
export async function GET() {
  const auth = await requireApiRole(["CITIZEN"]);
  if (auth.error) return authErrorResponse(auth.error);

  const t = getDictionary();

  try {
    const payload = await buildCitizenDataExport(auth.session.user.id, t);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="nova-terra-donnees-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // A failed export must never be silently lost: leave a follow-up.
    try {
      await pushNotification(auth.session.user.id, {
        title: t.citizen.account.export.failedNotificationTitle,
        body: t.citizen.account.export.failedNotificationBody,
        href: "/citizen/account",
      });
    } catch {
      // Best effort — never mask the export error.
    }
    return NextResponse.json(
      { error: t.errors.exportFailed },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
