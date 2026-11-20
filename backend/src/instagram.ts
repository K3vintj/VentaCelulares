import { Router } from "express";
import { env } from "./env.js";

import { createInstagramFeed } from './catalog/instagram-provider.js';
export { createInstagramFeed } from './catalog/instagram-provider.js';
export const instagram = Router();
const getFeed = createInstagramFeed({
  token: env.INSTAGRAM_ACCESS_TOKEN,
  username: env.INSTAGRAM_USERNAME,
  version: env.INSTAGRAM_API_VERSION,
});
instagram.get("/feed", async (_req, res) => {
  const feed = await getFeed();
  res.setHeader("Cache-Control", "public, max-age=60");
  if (!feed) {
    res
      .status(503)
      .json({
        error:
          "Visita nuestro perfil de Instagram para ver las últimas publicaciones.",
      });
    return;
  }
  res.json(feed);
});
