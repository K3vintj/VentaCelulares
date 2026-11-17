import { test } from "node:test";
import assert from "node:assert/strict";
import { createTikTokProfile } from "../tiktok.js";

const raw = {
  type: "rich", provider_name: "TikTok", author_url: "https://www.tiktok.com/@alexxzinostore",
  author_name: "Alexxziño Store", html: '<script>untrusted()</script>',
};

test("TikTok queries only the store, shares concurrent requests and caches safe profile fields", async () => {
  let calls = 0, clock = 0;
  const get = createTikTokProfile(async (input, init) => {
    calls++;
    const url = new URL(String(input));
    assert.equal(url.origin, "https://www.tiktok.com");
    assert.equal(url.pathname, "/oembed");
    assert.equal(url.searchParams.get("url"), raw.author_url);
    assert.equal(init?.redirect, "error");
    assert(!new Headers(init?.headers).has("Authorization"));
    return new Response(JSON.stringify(raw));
  }, () => clock);
  const profiles = await Promise.all([get(), get(), get()]);
  assert.equal(calls, 1);
  assert.deepEqual(profiles[0], {
    username: "alexxzinostore", name: raw.author_name, profileUrl: raw.author_url,
    embedUrl: "https://www.tiktok.com/embed/@alexxzinostore",
  });
  assert(!JSON.stringify(profiles).includes("untrusted"));
  await get();
  assert.equal(calls, 1);
  clock = 300001;
  await get();
  assert.equal(calls, 2);
});

test("TikTok rejects wrong accounts, untrusted URLs, oversized payloads and upstream failures", async () => {
  for (const author_url of ["https://www.tiktok.com/@other", "https://www.tiktok.com.evil.test/@alexxzinostore", "javascript:alert(1)"]) {
    const get = createTikTokProfile(async () => new Response(JSON.stringify({ ...raw, author_url })));
    assert.equal(await get(), null);
  }
  for (const response of [new Response("{}", { status: 503 }), new Response("not json"), new Response("a".repeat(100001))]) {
    assert.equal(await createTikTokProfile(async () => response)(), null);
  }
  let calls = 0, clock = 0;
  const failed = createTikTokProfile(async () => { calls++; throw new Error("private upstream detail"); }, () => clock);
  assert.equal(await failed(), null);
  assert.equal(await failed(), null);
  assert.equal(calls, 1);
  clock = 30001;
  assert.equal(await failed(), null);
  assert.equal(calls, 2);
});
