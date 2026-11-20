import { Router } from "express";

import { createTikTokProfile, TIKTOK_USERNAME } from './catalog/tiktok-provider.js';
export { createTikTokProfile, TIKTOK_USERNAME } from './catalog/tiktok-provider.js';
export const tiktok = Router();
const getProfile = createTikTokProfile();
tiktok.get("/profile", async (_req, res) => {
  const profile = await getProfile();
  if (!profile) {
    res.setHeader("Cache-Control", "public, max-age=30");
    res.status(503).json({ error: "Visita nuestro perfil de TikTok para ver las publicaciones." });
    return;
  }
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ profile });
});
