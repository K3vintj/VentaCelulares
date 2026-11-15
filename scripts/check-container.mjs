import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

// This disposable container receives placeholders only, never Supabase secrets.
const name = `vc-ci-${randomUUID().slice(0, 12)}`;
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", timeout: 30000 }).trim();
try {
  docker("run", "--detach", "--rm", "--name", name,
    "--publish", "127.0.0.1::10000", "--env", "PORT=10000",
    "--env", "DATABASE_URL=postgresql://test:test@127.0.0.1:5432/unused",
    "--env", "RENDER=true", "--env", "RENDER_EXTERNAL_URL=https://store.example.com",
    "--env", "TRUST_PROXY=loopback,uniquelocal", "--env", "LOG_REQUESTS=false",
    "--env", "SUPABASE_URL=https://project.supabase.co", "--env", "SUPABASE_SERVICE_ROLE_KEY=test-only",
    "ventacelulares:ci");
  const port = docker("port", name, "10000/tcp").split(":").at(-1);
  assert.match(port || "", /^\d+$/);
  const base = `http://127.0.0.1:${port}`;
  let available = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) { available = true; break; }
    } catch { /* Wait for the container to start. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(available, "Container did not start");
  assert.notEqual(docker("exec", name, "id", "-u"), "0", "Runtime must not run as root");
  const headers = { "X-Forwarded-Proto": "https" };
  const page = await fetch(base, { headers });
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
  const html = await page.text();
  const script = html.match(/src="([^"]+\.js)"/)?.[1];
  assert(script, "Missing compiled frontend");
  assert.equal((await fetch(base + script, { headers })).status, 200);
  for (const path of ["/admin", "/privacidad", "/cookies"]) {
    const response = await fetch(base + path, { headers });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") || "", /text\/html/);
  }
  const redirect = await fetch(`${base}/admin`, { redirect: "manual" });
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("location"), "https://store.example.com/admin");
  for (const path of ["/.env", "/backend/.env", "/.backups/key.hex"]) {
    assert.equal((await fetch(base + path, { headers })).status, 404, path);
  }
  assert.equal((await fetch(`${base}/api/admin/orders`, { headers })).status, 401);
  const images = readdirSync("dist/assets").filter((file) => file.startsWith("hero-iphone-") && file.endsWith(".png"));
  assert(images.length > 0, "Missing hero asset");
  for (const file of images) {
    const response = await fetch(`${base}/assets/${file}`, { headers });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "Hero must be a real PNG, not an LFS pointer");
  }
  for (const file of ["logo-alexxzino.jpg", "logo-alexxzino-contact.jpg"]) {
    const response = await fetch(`${base}/${file}`, { headers });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, "Logo must be a real JPEG");
  }
  console.log("Docker smoke check passed: Node production, non-root, Render URL/HTTPS, static frontend/images, legal routes and admin protection.");
} catch (error) {
  try { console.error(docker("logs", name)); } catch { /* Container may not exist. */ }
  throw error;
} finally {
  try { docker("rm", "--force", name); } catch { /* Already removed. */ }
}
