import "server-only";

import { formatDateTime } from "@/lib/format";
import { format } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import type { TrackedRequest, TrackingKind } from "@/lib/request-tracking";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function kindLabel(kind: TrackingKind, t: Dictionary): string {
  return (t.citizen.tracking.kinds as Record<string, string>)[kind] ?? kind;
}

function statusLabel(kind: TrackingKind, status: string, t: Dictionary): string {
  const maps: Record<TrackingKind, Record<string, string>> = {
    request: t.requestStatus as Record<string, string>,
    report: t.reportStatus as Record<string, string>,
    order: t.orderStatus as Record<string, string>,
    appointment: t.appointmentStatus as Record<string, string>,
    contact: t.citizen.tracking.contactStatus as Record<string, string>,
  };
  return maps[kind]?.[status] ?? status;
}

function priorityLabel(
  kind: TrackingKind,
  priority: string | null | undefined,
  t: Dictionary,
): string | null {
  if (!priority) return null;
  if (kind === "report") return (t.reportPriority as Record<string, string>)[priority] ?? priority;
  if (kind === "request") return (t.requestPriority as Record<string, string>)[priority] ?? priority;
  return priority;
}

/**
 * Renders a self-contained, printable HTML recap of a citizen's requests.
 * Everything dynamic is HTML-escaped; the document opens in any browser and
 * prints to PDF without the platform.
 */
export function buildRecapHtml(input: {
  items: TrackedRequest[];
  citizenName: string | null;
  t: Dictionary;
  locale: Locale;
  generatedAt: Date;
}): string {
  const { items, citizenName, t, locale, generatedAt } = input;

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1;
    return acc;
  }, {});

  const summaryRows = (Object.keys(counts) as TrackingKind[])
    .map((kind) => `<li>${escapeHtml(kindLabel(kind, t))}: <strong>${counts[kind]}</strong></li>`)
    .join("");

  const entries = items
    .map((item) => {
      const priority = priorityLabel(item.kind, item.priority, t);
      const fields = [
        [t.citizen.recap.kind, kindLabel(item.kind, t)],
        [t.citizen.recap.status, statusLabel(item.kind, item.status, t)],
        priority ? [t.citizen.recap.priority, priority] : null,
        [t.citizen.recap.createdAt, formatDateTime(item.createdAt, locale)],
        [t.citizen.recap.updatedAt, formatDateTime(item.updatedAt, locale)],
      ].filter(Boolean) as [string, string][];

      const timeline = item.steps.length
        ? `<h4>${escapeHtml(t.citizen.recap.timeline)}</h4><ol class="timeline">${item.steps
            .map(
              (step) =>
                `<li><span class="step-status">${escapeHtml(
                  statusLabel(item.kind, step.status, t),
                )}</span> <span class="muted">${escapeHtml(
                  formatDateTime(step.createdAt, locale),
                )}</span>${step.note ? `<div class="muted">${escapeHtml(step.note)}</div>` : ""}</li>`,
            )
            .join("")}</ol>`
        : "";

      return `<article class="entry">
  <h3>${escapeHtml(item.reference)} — ${escapeHtml(item.title)}</h3>
  <dl class="fields">${fields
    .map(
      ([label, value]) =>
        `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
    )
    .join("")}</dl>
  ${timeline}
</article>`;
    })
    .join("");

  const body =
    items.length === 0
      ? `<p class="empty">${escapeHtml(t.citizen.recap.empty)}</p>`
      : `<section class="summary"><h2>${escapeHtml(
          t.citizen.recap.summary,
        )}</h2><p>${escapeHtml(
          format(t.citizen.recap.total, { count: items.length }),
        )}</p><ul class="counts">${summaryRows}</ul></section>${entries}`;

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(t.citizen.recap.title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 2rem; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.5; }
  header.doc { border-bottom: 2px solid #111827; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  header.doc h1 { margin: 0; font-size: 1.5rem; }
  header.doc p { margin: 0.25rem 0 0; color: #4b5563; }
  .meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 0.5rem; color: #374151; font-size: 0.875rem; }
  .summary { border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem; }
  .summary h2 { margin: 0 0 0.25rem; font-size: 1rem; }
  .counts { display: flex; flex-wrap: wrap; gap: 1rem; list-style: none; padding: 0; margin: 0.5rem 0 0; font-size: 0.875rem; }
  .entry { border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; page-break-inside: avoid; }
  .entry h3 { margin: 0 0 0.75rem; font-size: 1rem; }
  .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 0.5rem 1rem; margin: 0; }
  .fields dt { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  .fields dd { margin: 0; font-size: 0.9rem; }
  .entry h4 { margin: 1rem 0 0.5rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
  .timeline { margin: 0; padding-left: 1.25rem; }
  .timeline li { margin-bottom: 0.25rem; font-size: 0.875rem; }
  .step-status { font-weight: 600; }
  .muted { color: #6b7280; font-size: 0.8rem; }
  .empty { border: 1px dashed #9ca3af; border-radius: 0.5rem; padding: 2rem; text-align: center; color: #4b5563; }
  footer { margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 0.75rem; font-size: 0.75rem; color: #9ca3af; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <header class="doc">
    <h1>${escapeHtml(t.citizen.recap.title)}</h1>
    <p>${escapeHtml(t.citizen.recap.subtitle)}</p>
    <div class="meta">
      <span>${escapeHtml(format(t.citizen.recap.owner, { name: citizenName ?? t.common.none }))}</span>
      <span>${escapeHtml(
        format(t.citizen.recap.generatedOn, { date: formatDateTime(generatedAt, locale) }),
      )}</span>
    </div>
  </header>
  ${body}
  <footer>${escapeHtml(t.common.appName)} — ${escapeHtml(t.citizen.recap.title)}</footer>
</body>
</html>`;
}
