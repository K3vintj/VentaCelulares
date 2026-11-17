import { test } from "node:test";
import assert from "node:assert/strict";
import { createInstagramFeed } from "../instagram.js";
const settings = {
  token: "test-only-secret",
  username: "alexxzino_store",
  version: "v27.0",
};
const profile = {
  user_id: "12345",
  username: "alexxzino_store",
  name: "Tienda",
};
const media = {
  id: "post1",
  media_type: "IMAGE",
  media_url: "https://scontent.cdninstagram.com/photo.jpg",
  permalink: "https://www.instagram.com/p/EXAMPLE/",
  caption: "Novedades",
};
test("Instagram remains usable without configuration and does not contact Meta", async () => {
  let calls = 0;
  const get = createInstagramFeed(
    { ...settings, token: undefined },
    async () => {
      calls++;
      throw new Error("Unexpected request");
    },
  );
  assert.deepEqual(await get(), {
    configured: false,
    profile: null,
    posts: [],
  });
  assert.equal(calls, 0);
});
test("Instagram shares concurrent reads, caches responses and keeps the token server-side", async () => {
  let calls = 0,
    clock = 0;
  const request: typeof fetch = async (input, init) => {
    calls++;
    assert(!String(input).includes(settings.token));
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Bearer ${settings.token}`,
    );
    return new Response(
      JSON.stringify(
        String(input).includes("/media?") ? { data: [media] } : profile,
      ),
    );
  };
  const get = createInstagramFeed(settings, request, () => clock);
  const values = await Promise.all([get(), get(), get()]);
  assert.equal(calls, 2);
  assert.equal(values[0]?.posts.length, 1);
  assert(!JSON.stringify(values).includes(settings.token));
  await get();
  assert.equal(calls, 2);
  clock = 300001;
  await get();
  assert.equal(calls, 4);
});
test("Instagram rejects another account, unsafe media and upstream errors without exposing secrets", async () => {
  const wrong = createInstagramFeed(
    settings,
    async () =>
      new Response(JSON.stringify({ ...profile, username: "another_account" })),
  );
  assert.equal(await wrong(), null);
  const failed = createInstagramFeed(settings, async () => {
    throw new Error(settings.token);
  });
  assert.equal(await failed(), null);
  const unsafe = createInstagramFeed(
    settings,
    async (input) =>
      new Response(
        JSON.stringify(
          String(input).includes("/media?")
            ? {
                data: [
                  {
                    ...media,
                    media_url: "https://cdninstagram.com.evil.example/image",
                  },
                  { ...media, permalink: "javascript:alert(1)" },
                ],
              }
            : profile,
        ),
      ),
  );
  assert.equal((await unsafe())?.posts.length, 0);
});
