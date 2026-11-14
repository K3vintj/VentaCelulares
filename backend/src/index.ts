import { app } from "./app.js";
import { env } from "./env.js";
import { db } from "./prisma/db.js";
const server = app.listen(env.PORT, () => console.log(`API de VentaCelulares en http://localhost:${env.PORT}`));
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    const deadline = setTimeout(() => process.exit(1), 15000);
    deadline.unref();
    server.closeIdleConnections();
    server.close(() => { void db.close().then(() => process.exit(0)).catch(() => process.exit(1)); });
  });
}
