import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { authErrorResponse, serverErrorResponse } from "@/lib/api";
import { getPublishedAnnouncements } from "@/lib/data";
import { requireApiRole } from "@/lib/permissions";
import { auditActor, recordSecurityEvent } from "@/lib/security";
import { createAnnouncement } from "@/lib/services";
import { announcementSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const announcements = await getPublishedAnnouncements();
  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["COUNCIL"]);
  if (auth.error) return authErrorResponse(auth.error);

  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  let announcement;
  try {
    announcement = await createAnnouncement({
      ...parsed.data,
      authorId: auth.session.user.id,
    });
  } catch (error) {
    return serverErrorResponse("announcements.create", error);
  }

  await recordSecurityEvent({
    type: "CONTENT_CHANGED",
    outcome: "SUCCESS",
    ...auditActor(auth.session),
    targetType: "announcement",
    targetId: announcement.id,
    detail: "création via API",
  });

  revalidatePath("/announcements");
  return NextResponse.json({ announcement }, { status: 201 });
}
