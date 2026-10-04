"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useT } from "@/lib/i18n/client";

/**
 * F94 — when the browser loses its connection, a discreet strip points to the
 * degraded-mode page where the essentials (contacts, instructions, news)
 * remain readable.
 */
export function OfflineNotice() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-destructive/40 bg-background/95 px-4 py-2 text-center text-sm backdrop-blur"
    >
      <span className="text-foreground">{t.publicPages.status.offline.title}</span>{" "}
      <span className="text-muted-foreground">{t.publicPages.status.offline.body}</span>{" "}
      <Link href="/statut" className="text-primary underline-offset-4 hover:underline">
        {t.publicPages.status.offline.link}
      </Link>
    </div>
  );
}
