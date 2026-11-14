const base = process.env.MONITOR_URL?.replace(/\/$/, "");
async function main() {
  if (!base || !/^https?:\/\//.test(base)) throw new Error("Configura MONITOR_URL con el origen que vas a comprobar");
  for (const path of ["/", "/admin", "/api/health/ready", "/api/products", "/api/config"]) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(15000), redirect: "error" });
    if (!response.ok) throw new Error(`Falló la comprobación ${path}: HTTP ${response.status}`);
    if (path === "/api/health/ready" && !(await response.json()).ok) throw new Error("La base de datos no está lista");
    console.log(JSON.stringify({ check: path, ok: true, status: response.status }));
  }
  const privateResponse = await fetch(base + "/api/admin/orders", { signal: AbortSignal.timeout(15000) });
  if (privateResponse.status !== 401) throw new Error("La ruta administrativa no rechazó el acceso anónimo");
  console.log(JSON.stringify({ check: "admin_authorization", ok: true }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Monitor fallido"); process.exitCode = 1; });
