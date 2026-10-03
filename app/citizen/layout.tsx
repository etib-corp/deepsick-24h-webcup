import { ConsoleShell, type ConsoleNavItem } from "@/components/colony/ConsoleShell";
import { BroadcastBanner } from "@/components/layout/BroadcastBanner";
import { getUnreadNotificationCount } from "@/lib/data";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const unread = await getUnreadNotificationCount(session.user.id);

  const nav: ConsoleNavItem[] = [
    { href: "/citizen", label: t.citizen.nav.home, icon: "🏠" },
    { href: "/citizen/requests", label: t.citizen.tracking.title, icon: "📄" },
    { href: "/citizen/report", label: t.citizen.nav.report, icon: "⚠️" },
    { href: "/citizen/reports", label: t.citizen.nav.reports, icon: "📋" },
    { href: "/citizen/orders", label: t.citizen.nav.orders, icon: "🎫" },
    { href: "/citizen/wallet", label: t.citizen.nav.wallet, icon: "◈" },
    { href: "/citizen/appointments", label: t.citizen.nav.appointments, icon: "🗓️" },
    { href: "/citizen/map", label: t.citizen.nav.map, icon: "🗺️" },
    { href: "/citizen/account", label: t.citizen.account.title, icon: "⚙️" },
  ];

  return (
    <ConsoleShell
      station={t.citizen.station}
      nav={nav}
      unread={unread}
      bellHref="/citizen/notifications"
      role={session.user.role}
      banner={<BroadcastBanner />}
    >
      {children}
    </ConsoleShell>
  );
}
