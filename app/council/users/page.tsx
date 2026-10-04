import type { Metadata } from "next";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoleBadge } from "@/components/ui/StatusBadge";
import { setUserRoleAction } from "@/lib/actions/admin";
import { getUsers } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";
import { ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().council.users.title };
}

export default async function CouncilUsersPage() {
  const t = getDictionary();
  const session = await requirePageRole(["COUNCIL"]);
  const users = await getUsers();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-mono text-xl text-foreground">{t.council.users.title}</h1>
        <p className="text-sm text-muted-foreground">{t.council.users.subtitle}</p>
      </header>

      <SectionHeader
        title={t.council.users.colons}
        badge={<span className="font-mono text-[11px] text-muted-foreground">{users.length}</span>}
      />

      <div className="space-y-2">
        {users.map((user) => {
          const isSelf = user.id === session.user.id;
          return (
            <Card key={user.id} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FeedRow
                  className="flex-1 border-0 bg-transparent p-0"
                  title={user.name ?? t.council.users.unnamed}
                  meta={format(t.council.users.registeredOn, { date: formatDate(user.createdAt) })}
                  trailing={<RoleBadge role={user.role} />}
                />

                {isSelf ? (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t.council.users.you}
                  </span>
                ) : (
                  <form action={setUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      aria-label={format(t.accessibility.roleFor, {
                        name: user.name ?? user.email ?? user.username ?? t.council.users.unnamed,
                      })}
                      defaultValue={user.role}
                      className="h-8 w-auto rounded-md border border-input bg-transparent px-2 font-mono text-xs text-foreground"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {t.roles[role]}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" size="sm">
                      {t.council.users.update}
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
