import { BroadcastBanner } from "@/components/layout/BroadcastBanner";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SideMenu } from "@/components/layout/SideMenu";
import { getAuthSession } from "@/lib/permissions";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  const user = session?.user ? { name: session.user.name, role: session.user.role } : null;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader user={user} />
      <BroadcastBanner />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <PublicFooter />
      <SideMenu />
    </div>
  );
}
