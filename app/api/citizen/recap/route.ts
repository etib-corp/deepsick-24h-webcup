import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { requireApiRole } from "@/lib/permissions";
import { buildRecapHtml } from "@/lib/recap";
import { getCitizenRequestTracking } from "@/lib/request-tracking";

export const dynamic = "force-dynamic";

/**
 * Downloads a citizen's recap as a self-contained HTML document. Scoped to the
 * authenticated session, so it can only ever contain that citizen's requests.
 */
export async function GET() {
  const auth = await requireApiRole(["CITIZEN"]);
  if (auth.error) return authErrorResponse(auth.error);

  const t = getDictionary();
  const locale = getLocale();
  const items = await getCitizenRequestTracking(auth.session.user.id);

  const html = buildRecapHtml({
    items,
    citizenName: auth.session.user.name ?? null,
    t,
    locale,
    generatedAt: new Date(),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-terra-recap-${stamp}.html"`,
      "Cache-Control": "no-store",
    },
  });
}
