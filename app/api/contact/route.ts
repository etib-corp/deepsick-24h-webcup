import { NextResponse } from "next/server";

import { serverErrorResponse } from "@/lib/api";
import { getAuthSession } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { createContactMessage } from "@/lib/services";
import { contactSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const session = await getAuthSession();

  const raw = (body ?? {}) as Record<string, unknown>;
  await auditNeutralizedInputs(
    { subject: raw.subject, email: raw.email, body: raw.body },
    "api contact",
    session,
  );

  try {
    const message = await createContactMessage({
      ...parsed.data,
      authorId: session?.user?.id ?? null,
    });
    return NextResponse.json({ reference: message.reference }, { status: 201 });
  } catch (error) {
    return serverErrorResponse("contact.create", error);
  }
}
