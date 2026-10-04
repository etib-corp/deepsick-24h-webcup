import { NextResponse } from "next/server";

import { serverErrorResponse } from "@/lib/api";
import { BOT_TOKEN_FIELD, BOT_TRAP_FIELD } from "@/lib/bot-fields";
import {
  botGuardMessage,
  consumeFormToken,
  inspectFormSubmission,
  releaseFormToken,
} from "@/lib/bot-guard";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";
import { auditNeutralizedInputs } from "@/lib/security";
import { createContactMessage } from "@/lib/services";
import { contactSchema, firstError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const raw = (body ?? {}) as Record<string, unknown>;

  // F81 — the JSON surface requires the same invisible challenge as the form:
  // a direct POST without it is refused, traced, and can never be replayed.
  const guard = await inspectFormSubmission({
    form: "contact",
    token: raw[BOT_TOKEN_FIELD],
    trap: raw[BOT_TRAP_FIELD],
  });
  if (!guard.ok) {
    return NextResponse.json({ error: botGuardMessage(guard, getDictionary()) }, { status: 403 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const session = await getAuthSession();

  await auditNeutralizedInputs(
    { subject: raw.subject, email: raw.email, body: raw.body },
    "api contact",
    session,
  );

  if (!(await consumeFormToken(guard.nonce, "contact", guard.ip))) {
    return NextResponse.json({ error: getDictionary().errors.botBlocked }, { status: 403 });
  }

  try {
    const message = await createContactMessage({
      ...parsed.data,
      authorId: session?.user?.id ?? null,
    });
    return NextResponse.json({ reference: message.reference }, { status: 201 });
  } catch (error) {
    await releaseFormToken(guard.nonce);
    return serverErrorResponse("contact.create", error);
  }
}
