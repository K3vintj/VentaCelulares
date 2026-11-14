import { test } from "node:test";
import assert from "node:assert/strict";
import { readSettings } from "../settings.js";
const production = { NODE_ENV: "production", DATABASE_URL: "postgresql://test:test@localhost/test", FRONTEND_URL: "https://store.example.com", COOKIE_SECURE: "true", SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only" };
test("production rejects HTTP origins, insecure cookies, demo seeds and unrestricted proxy trust", () => {
  assert.throws(() => readSettings({ ...production, FRONTEND_URL: "http://store.example.com" }));
  assert.throws(() => readSettings({ ...production, COOKIE_SECURE: "false" }));
  assert.throws(() => readSettings({ ...production, SEED_DEMO: "true" }));
  assert.throws(() => readSettings({ ...production, TRUST_PROXY: "true" }));
  assert.throws(() => readSettings({ ...production, TRUST_PROXY: "1" }));
  const settings = readSettings({ ...production, TRUST_PROXY: "127.0.0.1,::1" });
  assert.deepEqual(settings.proxy, ["127.0.0.1", "::1"]);
  assert.deepEqual(settings.origins, ["https://store.example.com"]);
});

test("Render uses its assigned HTTPS URL unless an explicit origin is configured", () => {
  const render = { ...production, FRONTEND_URL: undefined, RENDER: "true", RENDER_EXTERNAL_URL: "https://ventacelulares-test.onrender.com" };
  assert.deepEqual(readSettings(render).origins, [render.RENDER_EXTERNAL_URL]);
  assert.deepEqual(readSettings({ ...render, FRONTEND_URL: production.FRONTEND_URL }).origins, [production.FRONTEND_URL]);
  assert.throws(() => readSettings({ ...render, RENDER_EXTERNAL_URL: "http://ventacelulares-test.onrender.com" }));
  assert.throws(() => readSettings({ ...render, RENDER: "false" }));
  assert.throws(() => readSettings({ ...render, RENDER_EXTERNAL_URL: undefined }));
});
