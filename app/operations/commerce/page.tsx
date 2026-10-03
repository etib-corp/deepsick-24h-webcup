import type { Metadata } from "next";

import { CommerceDashboard } from "@/components/commerce/CommerceDashboard";
import { getOrders } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { isOrderStatus } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().ops.commerce.title };
}

export default async function CommerceConsolePage({
  searchParams,
}: {
  searchParams?: { q?: string | string[]; status?: string | string[] };
}) {
  await requirePageRole(["MERCHANT", "COUNCIL"]);
  const orders = await getOrders({ type: "FOOD" });
  const query = typeof searchParams?.q === "string" ? searchParams.q.trim().slice(0, 160) : "";
  const status = isOrderStatus(searchParams?.status) ? searchParams.status : "";

  return <CommerceDashboard orders={orders} query={query} status={status} />;
}
