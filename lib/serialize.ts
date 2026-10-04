export type ActivityDto = {
  id: string;
  kind: "request" | "contact" | "announcement";
  title: string;
  subtitle: string;
  date: string;
  href: string;
};

export type StatsDto = {
  citizens: number;
  agents: number;
  services: number;
  announcements: number;
  requests: number;
  actionable: number;
  contacts: number;
};

export type RequestRowDto = {
  id: string;
  reference: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  authorName: string | null;
  assigneeName: string | null;
};

type RequestLike = {
  id: string;
  reference: string;
  subject: string;
  status: string;
  priority: string;
  category: string | null;
  createdAt: Date;
  author?: { name: string | null } | null;
  assignee?: { name: string | null } | null;
};

export function toRequestRow(request: RequestLike): RequestRowDto {
  return {
    id: request.id,
    reference: request.reference,
    subject: request.subject,
    status: request.status,
    priority: request.priority,
    category: request.category,
    createdAt: request.createdAt.toISOString(),
    authorName: request.author?.name ?? null,
    assigneeName: request.assignee?.name ?? null,
  };
}

export function toActivityDto(
  items: Array<{
    id: string;
    kind: "request" | "contact" | "announcement";
    title: string;
    subtitle: string;
    date: Date;
    href: string;
  }>,
): ActivityDto[] {
  return items.map((item) => ({ ...item, date: item.date.toISOString() }));
}

export type ReportRowDto = {
  id: string;
  reference: string;
  type: string;
  title: string;
  priority: string;
  status: string;
  sector: string | null;
  unit: string | null;
  createdAt: string;
  authorName: string | null;
  assigneeName: string | null;
};

type ReportLike = {
  id: string;
  reference: string;
  type: string;
  title: string;
  priority: string;
  status: string;
  sector: string | null;
  unit: string | null;
  createdAt: Date;
  author?: { name: string | null } | null;
  assignee?: { name: string | null } | null;
};

export function toReportRow(report: ReportLike): ReportRowDto {
  return {
    id: report.id,
    reference: report.reference,
    type: report.type,
    title: report.title,
    priority: report.priority,
    status: report.status,
    sector: report.sector,
    unit: report.unit,
    createdAt: report.createdAt.toISOString(),
    authorName: report.author?.name ?? null,
    assigneeName: report.assignee?.name ?? null,
  };
}

export type OrderRowDto = {
  id: string;
  reference: string;
  type: string;
  status: string;
  summary: string;
  total: number;
  etaMinutes: number | null;
  origin: string | null;
  destination: string | null;
  createdAt: string;
  customerName: string | null;
};

type OrderLike = {
  id: string;
  reference: string;
  type: string;
  status: string;
  summary: string;
  total: number;
  etaMinutes: number | null;
  origin: string | null;
  destination: string | null;
  createdAt: Date;
  customer?: { name: string | null } | null;
};

export function toOrderRow(order: OrderLike): OrderRowDto {
  return {
    id: order.id,
    reference: order.reference,
    type: order.type,
    status: order.status,
    summary: order.summary,
    total: order.total,
    etaMinutes: order.etaMinutes,
    origin: order.origin,
    destination: order.destination,
    createdAt: order.createdAt.toISOString(),
    customerName: order.customer?.name ?? null,
  };
}

export type TicketRowDto = {
  code: string;
  title: string;
  difficulty: string;
  level: number;
  xp: number;
  group: string | null;
  wave: number | null;
  isAi: boolean;
  status: string;
  assignee: string | null;
  commentCount: number;
  syncedAt: string;
  updatedAt: string;
};

type TicketLike = {
  code: string;
  title: string;
  difficulty: string;
  level: number;
  xp: number;
  group: string | null;
  wave: number | null;
  isAi: boolean;
  status: string;
  assignee: string | null;
  syncedAt: Date;
  updatedAt: Date;
  _count?: { comments: number };
};

export function toTicketRow(ticket: TicketLike): TicketRowDto {
  return {
    code: ticket.code,
    title: ticket.title,
    difficulty: ticket.difficulty,
    level: ticket.level,
    xp: ticket.xp,
    group: ticket.group,
    wave: ticket.wave,
    isAi: ticket.isAi,
    status: ticket.status,
    assignee: ticket.assignee,
    commentCount: ticket._count?.comments ?? 0,
    syncedAt: ticket.syncedAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export type SecurityAlertDto = {
  id: string;
  kind: string;
  rule: string;
  severity: string;
  status: string;
  detail: string | null;
  sourceType: string | null;
  sourceId: string | null;
  detectedAt: string;
};

type SecurityAlertLike = {
  id: string;
  kind: string;
  rule: string;
  severity: string;
  status: string;
  detail: string | null;
  sourceType: string | null;
  sourceId: string | null;
  detectedAt: Date;
};

export function toSecurityAlertDto(alert: SecurityAlertLike): SecurityAlertDto {
  return {
    id: alert.id,
    kind: alert.kind,
    rule: alert.rule,
    severity: alert.severity,
    status: alert.status,
    detail: alert.detail,
    sourceType: alert.sourceType,
    sourceId: alert.sourceId,
    detectedAt: alert.detectedAt.toISOString(),
  };
}
