import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { readSettings } from "./settings.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
export const env = readSettings(process.env);
export const allowedOrigins = env.origins;
