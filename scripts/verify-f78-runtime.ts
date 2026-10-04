// Verify the isolated production app in an existing Chrome installation via CDP.
// Requires: a build serving nova_f78_test on localhost:3100.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { encode } from "next-auth/jwt";
import { prisma } from "../lib/prisma";
import { createFixture, cleanFixture } from "../tests/helpers/f78-fixture";

async function main() {
  const chromePath = process.env.CHROME_PATH || [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium",
  ].find(existsSync);
  if (!chromePath) throw new Error("Set CHROME_PATH to an existing Chrome installation.");
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required for synthetic test sessions.");
  const fixture = await createFixture();
  const profile = mkdtempSync(join(tmpdir(), "nova-f78-chrome-"));
  const chrome = spawn(chromePath, [
    "--headless=new", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=9224", `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore" });
  let socket: WebSocket | undefined;
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  let nextId = 0;
  const requests: Array<{ method: string; url: string; rsc: boolean }> = [];
  const exceptions: unknown[] = [];
  try {
    let target: { webSocketDebuggerUrl: string } | undefined;
    for (let i = 0; i < 50; i++) {
      try {
        const response = await fetch("http://localhost:9224/json/new?about:blank", { method: "PUT" });
        target = await response.json() as typeof target;
        break;
      } catch { await sleep(200); }
    }
    if (!target) throw new Error("Chrome CDP did not start.");
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      socket!.addEventListener("open", () => resolve(), { once: true });
      socket!.addEventListener("error", () => reject(new Error("Chrome connection failed")), { once: true });
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const callback = pending.get(message.id);
        if (!callback) return;
        pending.delete(message.id);
        if (message.error) callback.reject(new Error(message.error.message));
        else callback.resolve(message.result);
      } else if (message.method === "Network.requestWillBeSent") {
        const request = message.params.request;
        requests.push({ method: request.method, url: request.url, rsc: request.headers.RSC === "1" });
      } else if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params);
    });
    async function send(method: string, params: Record<string, unknown> = {}) {
      const id = ++nextId;
      const reply = new Promise<any>((resolve, reject) => pending.set(id, { resolve, reject }));
      socket!.send(JSON.stringify({ id, method, params }));
      return reply;
    }
    const evaluate = async (expression: string) => {
      const value = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (value.exceptionDetails) throw new Error("Browser evaluation failed");
      return value.result.value;
    };
    const cookie = async (role: string, id: string) => {
      const value = await encode({ secret: process.env.NEXTAUTH_SECRET!, token: { id, sub: id, role, name: "F78 tester" } });
      await send("Network.setCookie", { name: "next-auth.session-token", value, url: "http://localhost:3100", httpOnly: true });
    };
    const navigate = async (path: string, expectedText: string) => {
      await send("Page.navigate", { url: `http://localhost:3100${path}` });
      for (let i = 0; i < 50; i++) {
        if (await evaluate(`document.body?.innerText.includes(${JSON.stringify(expectedText)})`)) return;
        await sleep(200);
      }
      throw new Error(`Expected content missing on ${path}`);
    };
    await send("Network.enable");
    await send("Page.enable");
    await send("Runtime.enable");
    await cookie("CITIZEN", fixture.owner.id);
    await navigate(`/citizen/requests/report/${fixture.prefix}-report-0`, "F78 report 0");
    assert.ok(await evaluate("document.body.innerText.includes('Long stored description.')"));
    await cookie("SECURITY", fixture.other.id);
    await navigate("/operations/security", "F78 report 0");
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(`a[href="/operations/security/${fixture.prefix}-report-1"]`)}) !== null`), false);
    await sleep(1000); // allow hydration before counting periodic requests
    requests.length = 0;
    await sleep(11000);
    const rscCount = () => requests.filter((r) => r.rsc || (r.method === "GET" && r.url.includes("_rsc="))).length;
    const visibleRefreshes = rscCount();
    assert.ok(visibleRefreshes >= 2, "Visible console stopped refreshing");
    console.log(JSON.stringify({ check: "visible-polling", seconds: 11, rscRequests: visibleRefreshes }));

    // Controlled browser visibility simulation exercises the same event/guard.
    await evaluate("Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));");
    requests.length = 0;
    await sleep(11000);
    assert.equal(rscCount(), 0);
    assert.equal(requests.filter((r) => r.method === "POST" && r.url.includes("/operations/security")).length, 0);
    console.log(JSON.stringify({ check: "hidden-polling-simulation", seconds: 11, rscRequests: 0, broadcastActions: 0 }));

    await evaluate("delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));");
    await sleep(1000);
    assert.ok(rscCount() >= 1, "Console failed to refresh on visibility return");
    requests.length = 0;
    await send("Network.emulateNetworkConditions", { offline: false, latency: 6000, downloadThroughput: -1, uploadThroughput: -1 });
    await sleep(11000);
    assert.ok(rscCount() <= 1, "Refreshes overlapped on a slow connection");
    console.log(JSON.stringify({ check: "slow-network-polling", latencyMs: 6000, seconds: 11, rscRequests: rscCount() }));
    await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await sleep(2000);

    await send("Network.clearBrowserCookies");
    await navigate("/login", "Bon retour");
    await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await evaluate("document.querySelector('#email').value = 'f78@example.test'; document.querySelector('#password').value = 'testpassword'; document.querySelector('form').requestSubmit();");
    await sleep(1500);
    assert.ok(await evaluate("document.body.innerText.includes('Connexion momentanément indisponible')"));
    assert.equal(await evaluate("document.querySelector('button[type=submit]').disabled"), false);
    assert.equal(exceptions.length, 0);
    console.log(JSON.stringify({ check: "offline-login", recoverable: true, browserExceptions: 0 }));
  } finally {
    socket?.close();
    chrome.kill();
    await new Promise<void>((resolve) => {
      if (chrome.exitCode !== null) resolve();
      else chrome.once("exit", () => resolve());
    });
    rmSync(profile, { recursive: true, force: true });
    await cleanFixture(fixture);
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
