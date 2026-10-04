import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/api";
import { getPublishedServices } from "@/lib/data";
import { requireApiRole } from "@/lib/permissions";
import { createMunicipalService } from "@/lib/services";
import { firstError, serviceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await getPublishedServices();
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["ADMIN"]);
  if (auth.error) return authErrorResponse(auth.error);

  const body = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const service = await createMunicipalService(parsed.data);
  revalidateTag("public-services");
  revalidatePath("/services");
  return NextResponse.json({ service }, { status: 201 });
}
