import type { Dictionary } from "@/lib/i18n/types";

export type BreadcrumbItem = { href: string; label: string };

/** Explicit routes prevent technical URL segments from becoming visible labels. */
export function getBreadcrumbs(
  pathname: string,
  t: Dictionary,
  currentLabel?: string,
): BreadcrumbItem[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const home = { href: "/", label: t.nav.home };
  const citizen = { href: "/citizen", label: t.nav.mySpace };
  const council = { href: "/council", label: t.council.station };
  const reports = { href: "/citizen/reports", label: t.citizen.reports.title };
  const requests = { href: "/citizen/requests", label: t.citizen.tracking.title };
  const appointments = { href: "/citizen/appointments", label: t.citizen.appointments.title };

  const publicPages: Record<string, string> = {
    "/services": t.nav.services,
    "/announcements": t.nav.announcements,
    "/transport": t.nav.transport,
    "/projects": t.nav.projects,
    "/eco": t.nav.eco,
    "/statut": t.nav.status,
    "/contact": t.nav.contact,
    "/apparence": t.nav.appearance,
  };
  const citizenPages: Record<string, string> = {
    "/citizen/requests": requests.label,
    "/citizen/reports": reports.label,
    "/citizen/orders": t.citizen.orders.title,
    "/citizen/wallet": t.citizen.wallet.title,
    "/citizen/appointments": appointments.label,
    "/citizen/map": t.citizen.map.title,
    "/citizen/notifications": t.citizen.notifications.title,
    "/citizen/account": t.citizen.account.title,
  };
  const councilPages: Record<string, string> = {
    "/council/services": t.council.services.title,
    "/council/announcements": t.council.announcements.title,
    "/council/users": t.council.users.title,
  };
  const stations: Record<string, string> = {
    "/operations/security": t.ops.security.title,
    "/operations/medical": t.ops.medical.title,
    "/operations/maintenance": t.ops.maintenance.title,
    "/operations/transport": t.ops.transport.title,
    "/operations/commerce": t.ops.commerce.title,
    "/operations/administration": t.ops.administration.title,
  };

  if (publicPages[path]) return [home, { href: path, label: publicPages[path] }];
  if (citizenPages[path]) return [home, citizen, { href: path, label: citizenPages[path] }];
  if (councilPages[path]) return [home, council, { href: path, label: councilPages[path] }];
  if (stations[path]) return [home, { href: path, label: stations[path] }];
  if (path === "/citizen/report") {
    return [home, citizen, reports, { href: path, label: t.citizen.report.title }];
  }
  if (path === "/citizen/appointments/nouveau") {
    return [home, citizen, appointments, { href: path, label: t.citizen.appointments.newAppointment }];
  }

  // Dynamic pages supply their already-loaded, authorised record title.
  // Layout instances remain hidden there, avoiding duplicate breadcrumbs.
  if (!currentLabel?.trim()) return [];
  const current = { href: path, label: currentLabel };
  if (/^\/services\/[^/]+$/.test(path)) {
    return [home, { href: "/services", label: t.nav.services }, current];
  }
  if (/^\/projects\/[^/]+$/.test(path)) {
    return [home, { href: "/projects", label: t.nav.projects }, current];
  }
  if (/^\/announcements\/[^/]+$/.test(path)) {
    return [home, { href: "/announcements", label: t.nav.announcements }, current];
  }
  if (/^\/citizen\/reports\/[^/]+$/.test(path)) return [home, citizen, reports, current];
  if (/^\/citizen\/requests\/(request|report|order|appointment|contact)\/[^/]+$/.test(path)) {
    return [home, citizen, requests, current];
  }
  const stationPath = path.slice(0, path.lastIndexOf("/"));
  if (stations[stationPath] && /^\/operations\/[^/]+\/[^/]+$/.test(path)) {
    return [home, { href: stationPath, label: stations[stationPath] }, current];
  }
  return [];
}
