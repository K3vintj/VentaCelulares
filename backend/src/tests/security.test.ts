import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Request, Response } from "express";
import { app } from "../app.js";
import { rateLimit } from "../http.js";

test("rate limiter bounds distinct clients and keeps enforcing existing client limits", (t) => {
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const limit = rateLimit(1, 15_000, 2);
  function attempt(ip: string) {
    let status = 200;
    let passed = false;
    const headers = new Map<string, unknown>();
    const response = {
      setHeader(name: string, value: unknown) { headers.set(name, value); },
      status(value: number) { status = value; return this; },
      json() { return this; },
    };
    limit({ ip } as Request, response as unknown as Response, () => { passed = true; });
    return { status, passed, headers };
  }
  assert.equal(attempt("client-1").passed, true);
  assert.equal(attempt("client-2").passed, true);
  assert.equal(attempt("client-3").status, 503);
  const repeated = attempt("client-1");
  assert.equal(repeated.status, 429);
  assert(repeated.headers.has("Retry-After"));
  now += 15_001;
  assert.equal(attempt("client-3").passed, true);
});

test("anonymous requests cannot read or mutate administrative data and cross-site writes are rejected", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (const path of ["products", "orders", "sales", "dashboard", "audit", "config"]) {
      const response = await fetch(`${base}/api/admin/${path}`);
      assert.equal(response.status, 401, path);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    const headers = { "X-Requested-With": "VentaCelulares", "Content-Type": "application/json" };
    assert.equal((await fetch(`${base}/api/admin/products`, { method: "POST", headers, body: "{}" })).status, 401);
    assert.equal((await fetch(`${base}/api/auth/logout`, { method: "POST" })).status, 403);
    assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST", headers: { ...headers, Origin: "https://untrusted.example" }, body: "{}" })).status, 403);
    const malformed = await fetch(`${base}/api/orders`, { method: "POST", headers, body: "{" });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error, "JSON inválido");
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.headers.get("x-content-type-options"), "nosniff");
    assert.match(health.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
    assert.equal(health.headers.get("x-powered-by"), null);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
