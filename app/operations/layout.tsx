import { redirect } from "next/navigation";

import { ConsoleShell, type ConsoleNavItem } from "@/components/colony/ConsoleShell";
import { BroadcastBanner } from "@/components/layout/BroadcastBanner";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { STAFF_ROLES, STATION_NAMES, homeForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  const session = await requirePageRole(STAFF_ROLES);

  const navByRole: Record<string, { home: string; nav: ConsoleNavItem[] }> = {
    SECURITY: {
      home: "/operations/security",
      nav: [{ href: "/operations/security", label: t.ops.nav.security, icon: "🛡️" }],
    },
    MEDIC: {
      home: "/operations/medical",
      nav: [{ href: "/operations/medical", label: t.ops.nav.medical, icon: "✚" }],
    },
    MAINTENANCE: {
      home: "/operations/maintenance",
      nav: [{ href: "/operations/maintenance", label: t.ops.nav.maintenance, icon: "🛠️" }],
    },
    DRIVER: {
      home: "/operations/transport",
      nav: [{ href: "/operations/transport", label: t.ops.nav.transport, icon: "🚡" }],
    },
    MERCHANT: {
      home: "/operations/commerce",
      nav: [{ href: "/operations/commerce", label: t.ops.nav.commerce, icon: "🍜" }],
    },
    ADMIN_AGENT: {
      home: "/operations/administration",
      nav: [{ href: "/operations/administration", label: t.ops.nav.administration, icon: "📄" }],
    },
    COUNCIL: {
      home: "/council",
      nav: [
        { href: "/council", label: t.council.nav.overview, icon: "🛰️" },
        { href: "/council/users", label: t.council.nav.users, icon: "👥" },
        { href: "/council/announcements", label: t.council.nav.announcements, icon: "📣" },
        { href: "/council/broadcasts", label: t.council.broadcasts.title, icon: "📢" },
      ],
    },
  };

  const config = navByRole[session.user.role];

  if (!config) redirect(homeForRole(session.user.role));

  return (
    <ConsoleShell
      station={STATION_NAMES[session.user.role] ?? t.common.appName}
      nav={config.nav}
      role={session.user.role}
      banner={<BroadcastBanner />}
    >
      {children}
    </ConsoleShell>
  );
}
