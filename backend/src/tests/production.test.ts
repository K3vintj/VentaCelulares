import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";
test("compiled production serves frontend/API with HTTPS guards and security headers", { skip: process.env.VC_INTEGRATION !== "true" || env.NODE_ENV === "production", timeout: 45000 }, async () => {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const address = probe.address(); assert(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../../dist/index.js", import.meta.url))], { env: { ...process.env, NODE_ENV: "production", PORT: String(port), SERVE_FRONTEND: "true", FRONTEND_URL: "https://store.example.com", COOKIE_SECURE: "true", TRUST_PROXY: "loopback", LOG_REQUESTS: "false", SEED_DEMO: "false" }, stdio: "pipe" });
  let log = "";
  child.stdout.on("data", (b) => { log += b.toString(); }); child.stderr.on("data", (b) => { log += b.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let started = false;
    for (let n = 0; n < 100; n++) {
      try { if ((await fetch(base + "/api/health")).ok) { started = true; break; } } catch {}
      if (child.exitCode !== null) throw new Error("Production process exited: " + log);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(started, log);
    const redirect = await fetch(base + "/admin", { redirect: "manual" });
    assert.equal(redirect.status, 308); assert.equal(redirect.headers.get("location"), "https://store.example.com/admin");
    const headers = { "X-Forwarded-Proto": "https" };
    const page = await fetch(base + "/admin", { headers });
    assert.equal(page.status, 200); assert.match(page.headers.get("content-type") || "", /text\/html/);
    assert.match(page.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
    assert(page.headers.has("strict-transport-security"));
    const html = await page.text(); const asset = html.match(/src="([^"]+\.js)"/)?.[1]; assert(asset);
    const script = await fetch(base + asset, { headers }); assert.equal(script.status, 200); assert.match(script.headers.get("cache-control") || "", /immutable/);
    assert.equal((await fetch(base + "/api/health/ready", { headers })).status, 200);
    assert.equal((await fetch(base + "/api/admin/orders", { headers })).status, 401);
    const missing = await fetch(base + "/api/missing", { headers }); assert.equal(missing.status, 404); assert.match(missing.headers.get("content-type") || "", /json/);
    assert.equal((await fetch(base + "/api/auth/logout", { method: "POST", headers: { ...headers, Origin: "https://other.example", "X-Requested-With": "VentaCelulares" } })).status, 403);
    assert.equal((await fetch(base + "/api/auth/logout", { method: "POST", headers: { "X-Requested-With": "VentaCelulares" } })).status, 400);
  } finally {
    if (child.exitCode === null) {
      const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
      child.kill(); await exited;
    }
  }
});
