import { ConsoleShell } from "@/components/colony/ConsoleShell";
import { BroadcastBanner } from "@/components/layout/BroadcastBanner";
import { getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function CouncilLayout({ children }: { children: React.ReactNode }) {
  const t = getDictionary();
  await requirePageRole(["COUNCIL"]);

  const nav = [
    { href: "/council", label: t.council.nav.overview, icon: "🛰️" },
    { href: "/council/users", label: t.council.nav.users, icon: "👥" },
    { href: "/council/announcements", label: t.council.nav.announcements, icon: "📣" },
    { href: "/council/broadcasts", label: t.council.broadcasts.title, icon: "📢" },
    { href: "/council/consultations", label: t.council.nav.consultations, icon: "🗣️" },
    { href: "/council/services", label: t.council.nav.services, icon: "🏛️" },
    { href: "/council/security", label: t.council.nav.security, icon: "🛡️" },
  ];

  return (
    <ConsoleShell station={t.council.station} nav={nav} banner={<BroadcastBanner />} role="COUNCIL">
      {children}
    </ConsoleShell>
  );
}
