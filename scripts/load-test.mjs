// Read-only HTTP load generator using Node's built-in fetch.
// Example: node scripts/load-test.mjs http://localhost:3100/api/services --users=100 --seconds=30
import { parseArgs } from "node:util";
import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    users: { type: "string", default: "100" },
    seconds: { type: "string", default: "30" },
    interval: { type: "string", default: "5000" },
    burst: { type: "boolean", default: false },
  },
});
const url = new URL(positionals[0] || "http://localhost:3100/api/services");
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("Use a local test instance. This runner refuses remote load tests.");
}
const users = Number(values.users), seconds = Number(values.seconds), interval = Number(values.interval);
if (!Number.isInteger(users) || users < 1 || users > 500 || !Number.isFinite(seconds) || seconds <= 0 || seconds > 600 || !Number.isFinite(interval) || interval < 100) {
  throw new Error("Expected 1–500 users, 1–600 seconds and interval >= 100 ms.");
}
const latencies = [], statuses = {};
let bytes = 0, errors = 0, requests = 0;
const start = performance.now(), deadline = start + seconds * 1000;
await Promise.all(Array.from({ length: users }, async (_, i) => {
  if (!values.burst) await sleep(i * interval / users);
  while (performance.now() < deadline) {
    const began = performance.now();
    requests++;
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: process.env.F78_COOKIE ? { Cookie: process.env.F78_COOKIE } : {},
        redirect: "manual",
      });
      statuses[response.status] = (statuses[response.status] || 0) + 1;
      bytes += (await response.arrayBuffer()).byteLength;
      if (!response.ok) errors++;
    } catch { errors++; }
    latencies.push(performance.now() - began);
    // Never overlap requests within one virtual client on a slow connection.
    await sleep(Math.max(0, Math.min(interval - (performance.now() - began), deadline - performance.now())));
  }
}));
latencies.sort((a, b) => a - b);
const elapsedSeconds = (performance.now() - start) / 1000;
const percentile = (p) => Math.round(latencies[Math.max(0, Math.ceil(latencies.length * p) - 1)] || 0);
console.log(JSON.stringify({
  path: url.pathname, users, intervalMs: interval, elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
  requests, requestsPerSecond: Number((requests / elapsedSeconds).toFixed(2)), errors, statuses,
  p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), bytes,
  note: "HTTP GET virtual clients. Does not emulate hydration, Server Actions or browser visibility. Cookie, if provided, belongs to one session.",
}, null, 2));
