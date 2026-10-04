import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { prisma } from "../lib/prisma";
import { getActiveBroadcasts, getIncidentReports, getPublishedServices } from "../lib/data";
import { getCitizenRequestDetail, getCitizenRequestTracking } from "../lib/request-tracking";
import { createReport, createAppointment, ensureAppointmentReminders, upsertOpinion } from "../lib/services";
import { createFixture, cleanFixture, queryLog } from "./helpers/f78-fixture";

let fixture: Awaited<ReturnType<typeof createFixture>>;
before(async () => { fixture = await createFixture(); });
after(async () => { if (fixture) await cleanFixture(fixture); await prisma.$disconnect(); });

test("concurrent reports have unique references and retain their creation event", async () => {
  const reports = await Promise.all(Array.from({ length: 30 }, () => createReport(fixture.owner.id, {
    type: "SECURITY", title: "Concurrent report", description: "Essential information", priority: "CRITICAL",
  })));
  assert.equal(new Set(reports.map((r) => r.reference)).size, 30);
  assert.equal(await prisma.reportEvent.count({ where: { reportId: { in: reports.map((r) => r.id) } } }), 30);
});

test("concurrent opinions keep one contribution per citizen", async () => {
  const opinions = await Promise.all(Array.from({ length: 15 }, () => upsertOpinion({
    consultationId: fixture.consultation.id, authorId: fixture.owner.id,
    stance: "SUPPORT", comment: "Concurrent contribution",
  })));
  assert.equal(new Set(opinions.map((o) => o.id)).size, 1);
  assert.equal(await prisma.opinion.count({ where: { consultationId: fixture.consultation.id } }), 1);
});

test("concurrent reservations of one slot produce one booking and one confirmation", async () => {
  const date = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const results = await Promise.allSettled(Array.from({ length: 15 }, (_, i) => createAppointment(
    i % 2 ? fixture.owner.id : fixture.other.id, { serviceId: fixture.service.id, date },
  )));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  for (const result of results) {
    if (result.status === "rejected") assert.match(result.reason.message, /créneau/);
  }
  assert.equal(await prisma.appointment.count({ where: { serviceId: fixture.service.id, date } }), 1);
  assert.equal(await prisma.notification.count({ where: { userId: { in: [fixture.owner.id, fixture.other.id] } } }), 1);
});

test("distinct simultaneous slots all succeed without count-based reference collisions", async () => {
  const appointments = await Promise.all(Array.from({ length: 10 }, (_, i) => createAppointment(fixture.owner.id, {
    serviceId: fixture.service.id, date: new Date(Date.now() + (30 + i) * 60 * 60 * 1000),
  })));
  assert.equal(new Set(appointments.map((a) => a.reference)).size, 10);
});

test("concurrent page loads deliver each due reminder once", async () => {
  await createAppointment(fixture.owner.id, {
    serviceId: fixture.service.id, date: new Date(Date.now() + 3 * 60 * 60 * 1000),
  });
  await Promise.all(Array.from({ length: 15 }, () => ensureAppointmentReminders(fixture.owner.id)));
  const due = await prisma.appointment.count({ where: { citizenId: fixture.owner.id, reminderSent: true } });
  assert.equal(await prisma.notification.count({ where: { userId: fixture.owner.id, title: { startsWith: "Rappel" } } }), due);
  assert.ok(due >= 1);
  assert.equal(await ensureAppointmentReminders(fixture.owner.id), 0);
});

test("incident queries retain all unit incidents, critical items and the maintenance/cleanliness split", async () => {
  const all = await prisma.report.findMany({ where: { authorId: fixture.owner.id } });
  const board = await getIncidentReports(["MAINTENANCE", "CLEANLINESS"]);
  assert.ok(board.every((r) => ["MAINTENANCE", "CLEANLINESS"].includes(r.type)));
  assert.equal(board.filter((r) => r.reference.startsWith(fixture.prefix)).length,
    all.filter((r) => ["MAINTENANCE", "CLEANLINESS"].includes(r.type)).length);
  const security = await getIncidentReports(["SECURITY"]);
  assert.ok(security.some((r) => r.priority === "CRITICAL"));
  assert.equal(await getCitizenRequestDetail(fixture.other.id, "report", `${fixture.prefix}-report-0`), null);
  queryLog().length = 0;
  const report = await getCitizenRequestDetail(fixture.owner.id, "report", `${fixture.prefix}-report-0`);
  assert.ok(report);
  assert.ok(queryLog().every((q) => !/FROM `nova_f78_test`\.`(Order|Appointment|ContactMessage|ServiceRequest)`/.test(q.query)));
  const tracked = await getCitizenRequestTracking(fixture.owner.id);
  assert.deepEqual(report, { ...tracked.find((r) => r.id === report.id), events: [] });
  assert.equal(await getCitizenRequestDetail(fixture.owner.id, "unknown", report.id), null);
});

test("public cache hits preserve Dates and explicit tag invalidation exposes updates", async () => {
  queryLog().length = 0;
  await Promise.all(Array.from({ length: 100 }, () => getPublishedServices()));
  const reads = queryLog().length;
  assert.equal(reads, 1);
  const hit = await getPublishedServices();
  assert.ok(reads > 0);
  assert.equal(queryLog().length, reads);
  assert.ok(hit.every((s) => s.createdAt instanceof Date && s.updatedAt instanceof Date));
  await prisma.municipalService.update({ where: { id: fixture.service.id }, data: { name: "Updated test service" } });
  const cache = (globalThis as unknown as { __incrementalCache: { revalidateTag(tag: string): Promise<void> } }).__incrementalCache;
  await cache.revalidateTag("public-services");
  const fresh = await getPublishedServices();
  assert.equal(fresh.find((s) => s.id === fixture.service.id)?.name, "Updated test service");
});

test("all detail categories enforce ownership and preserve the full timeline", async () => {
  const request = await prisma.serviceRequest.create({ data: {
    subject: "F78 request", description: "Full citizen description", authorId: fixture.owner.id,
    history: { create: { status: "SUBMITTED", note: "Initial event" } },
  } });
  const order = await prisma.order.create({ data: { type: "FOOD", summary: "F78 order", customerId: fixture.owner.id } });
  const contact = await prisma.contactMessage.create({ data: {
    subject: "F78 contact", body: "Full message", email: fixture.owner.email, authorId: fixture.owner.id,
  } });
  const appointment = await createAppointment(fixture.owner.id, {
    serviceId: fixture.service.id, date: new Date(Date.now() + 50 * 60 * 60 * 1000),
  });
  const full = await getCitizenRequestTracking(fixture.owner.id);
  for (const [kind, id] of [
    ["request", request.id], ["order", order.id], ["contact", contact.id],
    ["appointment", appointment.id], ["report", `${fixture.prefix}-report-0`],
  ]) {
    const detail = await getCitizenRequestDetail(fixture.owner.id, kind, id);
    const existing = full.find((item) => item.id === id && item.kind === kind);
    assert.ok(detail && existing);
    for (const field of ["title", "description", "status", "reference", "steps", "scheduledAt", "hasHistory"] as const) {
      assert.deepEqual(detail[field], existing[field]);
    }
    assert.equal(await getCitizenRequestDetail(fixture.other.id, kind, id), null);
  }
});

test("broadcast scheduling is evaluated on each read, with no cache delay", async () => {
  const start = new Date(Date.now() + 60000);
  const end = new Date(start.getTime() + 60000);
  const broadcast = await prisma.broadcast.create({ data: {
    title: "F78 window", message: "Essential announcement", startsAt: start, endsAt: end, authorId: fixture.owner.id,
  } });
  try {
    assert.ok(!(await getActiveBroadcasts(new Date(start.getTime() - 1))).some((b) => b.id === broadcast.id));
    assert.ok((await getActiveBroadcasts(start)).some((b) => b.id === broadcast.id));
    assert.ok(!(await getActiveBroadcasts(new Date(end.getTime() + 1))).some((b) => b.id === broadcast.id));
    await prisma.broadcast.update({ where: { id: broadcast.id }, data: { active: false } });
    assert.ok(!(await getActiveBroadcasts(start)).some((b) => b.id === broadcast.id));
  } finally { await prisma.broadcast.delete({ where: { id: broadcast.id } }); }
});
