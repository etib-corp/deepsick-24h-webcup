import { ConsoleShell } from "@/components/colony/ConsoleShell";
import { requireDevPanel } from "@/lib/dev-access";
import { getDictionary } from "@/lib/i18n/server";
import { getAuthSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DevLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  await requireDevPanel();
  const session = await getAuthSession();

  const nav = [
    { href: "/dev/tickets", label: t.dev.nav.tickets, icon: "🎫" },
    { href: "/apparence", label: t.dev.nav.appearance, icon: "🎨" },
  ];

  return (
    <ConsoleShell station={t.dev.station} nav={nav} role={session?.user?.role ?? null}>
      {children}
    </ConsoleShell>
  );
}
