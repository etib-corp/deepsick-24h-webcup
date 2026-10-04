// Run with the isolated MySQL preload; no dependencies or production writes.
import { performance } from "node:perf_hooks";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { prisma } from "../lib/prisma";
import { getIncidentReports, getPublishedServices, getActiveBroadcasts } from "../lib/data";
import { getCitizenRequestDetail, getCitizenRequestTracking } from "../lib/request-tracking";
import { createFixture, cleanFixture, queryLog } from "../tests/helpers/f78-fixture";

async function burst(name: string, users: number, read: () => Promise<unknown>) {
  queryLog().length = 0;
  const elapsed: number[] = [];
  let errors = 0;
  const start = performance.now();
  await Promise.all(Array.from({ length: users }, async () => {
    const began = performance.now();
    try { await read(); } catch { errors++; }
    elapsed.push(performance.now() - began);
  }));
  elapsed.sort((a, b) => a - b);
  return {
    name, concurrentCalls: users, sqlStatements: queryLog().length, errors,
    wallMs: Math.round(performance.now() - start),
    p50Ms: Math.round(elapsed[Math.ceil(elapsed.length * 0.5) - 1]),
    p95Ms: Math.round(elapsed[Math.ceil(elapsed.length * 0.95) - 1]),
    p99Ms: Math.round(elapsed[Math.ceil(elapsed.length * 0.99) - 1]),
  };
}

async function main() {
  const fixture = await createFixture(400);
  const broadcast = await prisma.broadcast.create({
    data: { title: "F78 benchmark", message: "Essential announcement", authorId: fixture.owner.id },
  });
  try {
    const oldIncidents = () => prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, sector: true } }, assignee: { select: { name: true } } },
    });
    const oldServices = () => prisma.municipalService.findMany({
      where: { published: true }, orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    });
    const before = await oldIncidents();
    const after = await getIncidentReports(["SECURITY"]);
    console.log(JSON.stringify({
      dataset: "400 reports, equally split between four units; long descriptions",
      before: { rows: before.length, jsonBytesFromDatabase: Buffer.byteLength(JSON.stringify(before)) },
      after: { rows: after.length, jsonBytesFromDatabase: Buffer.byteLength(JSON.stringify(after)) },
      note: "Direct server data functions, not HTTP or 500 logged-in browsers. Bytes are JSON size of returned DB objects, not wire SQL bytes.",
    }));
    const id = `${fixture.prefix}-report-0`;
    // Warm only the cache scenario explicitly labelled warm.
    await getPublishedServices();
    for (const users of [100, 500]) {
      for (const [name, read] of [
        ["incidents-before", oldIncidents],
        ["incidents-after", () => getIncidentReports(["SECURITY"])],
        ["detail-before", async () => (await getCitizenRequestTracking(fixture.owner.id)).find((r) => r.id === id)],
        ["detail-after", () => getCitizenRequestDetail(fixture.owner.id, "report", id)],
        ["services-before", oldServices],
        ["services-after-warm-cache", () => getPublishedServices()],
        ["F73-current", () => getActiveBroadcasts()],
      ] as const) {
        console.log(JSON.stringify(await burst(name, users, read)));
      }
    }
    if (process.argv.includes("--http")) {
      // Hold the same dataset for both HTTP runs. Allow the production cache
      // to revalidate after this fixture was created outside a Server Action.
      let visible = false;
      const deadline = Date.now() + 65000;
      while (Date.now() < deadline) {
        const response = await fetch("http://localhost:3100/api/services", { signal: AbortSignal.timeout(5000) });
        const data = await response.json() as { services: Array<{ id: string }> };
        if (data.services.some((s) => s.id === fixture.service.id)) { visible = true; break; }
        await sleep(500);
      }
      if (!visible) throw new Error("Test service missing: start the production test app on port 3100 with nova_f78_test.");
      for (const users of [100, 500]) {
        await new Promise<void>((resolve, reject) => {
          const child = spawn(process.execPath, [
            "scripts/load-test.mjs", "http://localhost:3100/api/services", `--users=${users}`, "--seconds=15",
          ], { stdio: "inherit" });
          child.on("error", reject);
          child.on("exit", (code) => code === 0 ? resolve() : reject(new Error("HTTP benchmark failed")));
        });
      }
    }
  } finally {
    await prisma.broadcast.delete({ where: { id: broadcast.id } });
    await cleanFixture(fixture);
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
