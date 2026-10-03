import type { Metadata } from "next";
import Link from "next/link";

import { FeedRow, SectionHeader } from "@/components/colony/FeedRow";
import { Button } from "@/components/ui/Button";
import { markNotificationsReadAction } from "@/lib/actions/notifications";
import { getNotifications } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { format, getDictionary } from "@/lib/i18n/server";
import { requirePageRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: getDictionary().citizen.notifications.title };
}

export default async function CitizenNotificationsPage() {
  const t = getDictionary();
  const session = await requirePageRole(["CITIZEN"]);
  const notifications = await getNotifications(session.user.id);
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl text-foreground">{t.citizen.notifications.title}</h1>
          <p className="text-sm text-muted-foreground">
            {format(t.citizen.notifications.unread, { count: unread })}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="secondary" size="sm">
              {t.citizen.notifications.markAll}
            </Button>
          </form>
        ) : null}
      </div>

      <SectionHeader title={t.citizen.notifications.feed} />
      {notifications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t.citizen.notifications.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const row = (
              <FeedRow
                icon={
                  <>
                    <span aria-hidden>{notification.read ? "•" : "◉"}</span>
                    <span className="sr-only">
                      {notification.read ? t.accessibility.read : t.accessibility.unread}
                    </span>
                  </>
                }
                title={notification.title}
                meta={`${formatDateTime(notification.createdAt)}${notification.body ? ` · ${notification.body}` : ""}`}
              />
            );
            return notification.href ? (
              <Link key={notification.id} href={notification.href}>
                {row}
              </Link>
            ) : (
              <div key={notification.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
