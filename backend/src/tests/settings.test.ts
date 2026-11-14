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
