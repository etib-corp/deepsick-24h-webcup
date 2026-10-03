"use client";

import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/client";
import {
  isAppointmentStatus,
  isOrderStatus,
  isReportPriority,
  isReportStatus,
  isRequestStatus,
  isRole,
  type AppointmentStatus,
  type OrderStatus,
  type ReportPriority,
  type ReportStatus,
  type RequestPriority,
  type Role,
} from "@/lib/roles";

type Tone = "neutral" | "mars" | "info" | "success" | "warning" | "danger";

const REPORT_STATUS_TONES: Record<ReportStatus, Tone> = {
  OPEN: "danger",
  ASSIGNED: "warning",
  EN_ROUTE: "mars",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const REPORT_PRIORITY_TONES: Record<ReportPriority, Tone> = {
  LOW: "neutral",
  NORMAL: "info",
  HIGH: "warning",
  CRITICAL: "danger",
};

const REQUEST_STATUS_TONES: Record<string, Tone> = {
  SUBMITTED: "mars",
  IN_REVIEW: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const REQUEST_PRIORITY_TONES: Record<RequestPriority, Tone> = {
  LOW: "neutral",
  NORMAL: "info",
  HIGH: "warning",
  URGENT: "danger",
};

const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "mars",
  READY: "info",
  IN_TRANSIT: "mars",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const APPOINTMENT_STATUS_TONES: Record<AppointmentStatus, Tone> = {
  BOOKED: "mars",
  CANCELLED: "neutral",
  COMPLETED: "success",
};

const ROLE_TONES: Record<Role, Tone> = {
  CITIZEN: "mars",
  SECURITY: "danger",
  MEDIC: "info",
  MAINTENANCE: "warning",
  DRIVER: "info",
  MERCHANT: "success",
  ADMIN_AGENT: "neutral",
  COUNCIL: "mars",
};

/** Report / incident status (OPEN → CLOSED). */
export function ReportStatusBadge({ status }: { status: string }) {
  const t = useT();
  const label = isReportStatus(status) ? t.reportStatus[status] : status;
  return (
    <Badge tone={isReportStatus(status) ? REPORT_STATUS_TONES[status] : "neutral"}>{label}</Badge>
  );
}

/** Report priority (LOW → CRITICAL). */
export function ReportPriorityBadge({ priority }: { priority: string }) {
  const t = useT();
  const label = isReportPriority(priority) ? t.reportPriority[priority] : priority;
  return (
    <Badge tone={isReportPriority(priority) ? REPORT_PRIORITY_TONES[priority] : "neutral"}>
      {label}
    </Badge>
  );
}

/** Order status (taxi / restauration). */
export function OrderStatusBadge({ status }: { status: string }) {
  const t = useT();
  const label = isOrderStatus(status) ? t.orderStatus[status] : status;
  return (
    <Badge tone={isOrderStatus(status) ? ORDER_STATUS_TONES[status] : "neutral"}>{label}</Badge>
  );
}

/** Rendez-vous status (BOOKED → CANCELLED / COMPLETED). */
export function AppointmentStatusBadge({ status }: { status: string }) {
  const t = useT();
  const label = isAppointmentStatus(status) ? t.appointmentStatus[status] : status;
  return (
    <Badge tone={isAppointmentStatus(status) ? APPOINTMENT_STATUS_TONES[status] : "neutral"}>
      {label}
    </Badge>
  );
}

/** Démarche administrative status (kept for the documented municipal needs). */
export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const label = isRequestStatus(status) ? t.requestStatus[status] : status;
  return <Badge tone={REQUEST_STATUS_TONES[status] ?? "neutral"}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const t = useT();
  const label =
    priority in t.requestPriority
      ? t.requestPriority[priority as RequestPriority]
      : priority;
  return (
    <Badge tone={REQUEST_PRIORITY_TONES[priority as RequestPriority] ?? "neutral"}>{label}</Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const t = useT();
  const label = isRole(role) ? t.roles[role] : role;
  return <Badge tone={isRole(role) ? ROLE_TONES[role] : "neutral"}>{label}</Badge>;
}
