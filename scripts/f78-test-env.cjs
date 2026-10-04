// Standalone integration runner. Never permit writes to the application DB.
const Module = require("node:module");
const path = require("node:path");
const fs = require("node:fs");

if (fs.existsSync(".env")) process.loadEnvFile(".env");
const database = new URL(process.env.F78_DATABASE_URL || process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
  throw new Error("F78 integration tests require a local MySQL server.");
}
database.pathname = "/nova_f78_test";
process.env.DATABASE_URL = database.toString();
globalThis.AsyncLocalStorage = require("node:async_hooks").AsyncLocalStorage;

// Server-only is a bundler boundary. These tests run server code in Node.
// Supply a fixed request locale; database and transaction behavior stay real.
const load = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  if (name === "next/headers") return { cookies: () => ({ get: () => undefined }) };
  // React 18 exposes cache through Next's RSC renderer, not its Node entry.
  if (name === "react") {
    const react = load.call(this, name, ...args);
    return { ...react, cache: react.cache || ((callback) => callback) };
  }
  return load.call(this, name, ...args);
};

const { PrismaClient } = require("@prisma/client");
globalThis.prisma = new PrismaClient({ log: [{ emit: "event", level: "query" }] });
globalThis.f78Queries = [];
globalThis.prisma.$on("query", (event) => globalThis.f78Queries.push(event));

// Exercise Next 14's real incremental cache, isolated from the running app.
const { IncrementalCache } = require("next/dist/server/lib/incremental-cache");
const { nodeFs } = require("next/dist/server/lib/node-fs-methods");
globalThis.__incrementalCache = new IncrementalCache({
  fs: nodeFs, dev: false, appDir: true, pagesDir: false, flushToDisk: false,
  serverDistDir: path.join(require("node:os").tmpdir(), "nova-f78-cache", String(process.pid), "server"),
  requestHeaders: {}, requestProtocol: "http", maxMemoryCacheSize: 5 * 1024 * 1024,
  getPrerenderManifest: () => ({ version: 4, routes: {}, dynamicRoutes: {}, notFoundRoutes: [], preview: { previewModeId: "f78" } }),
  experimental: { ppr: false },
});
