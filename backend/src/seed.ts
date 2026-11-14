import "./env.js";
import argon2 from "argon2";
import { db } from "./prisma/db.js";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@alexxzinostore.mx";

  // 1. Crear administrador único (VC-046, VC-135)
  const existingAdmin = await db.orm.public.AdminUser.where({ email }).first();

  if (!existingAdmin) {
    const passwordPlain = process.env.ADMIN_INITIAL_PASSWORD;
    if (!passwordPlain || passwordPlain.length < 14) throw new Error("Configura ADMIN_INITIAL_PASSWORD con al menos 14 caracteres");
    const passwordHash = await argon2.hash(passwordPlain, { type: argon2.argon2id });
    await db.orm.public.AdminUser.create({
      email,
      passwordHash,
      name: "Administrador Alexxziño",
    });
    console.log("Admin creado:", email);
  } else {
    console.log("ℹEl admin ya existe:", email);
  }

  // 2. Crear configuración inicial del negocio (VC-057)
  const existingConfig = await db.orm.public.BusinessConfig.where({
    id: "default",
  }).first();

  if (!existingConfig) {
    await db.orm.public.BusinessConfig.create({
      id: "default",
      businessName: "Alexxziño Store",
      whatsapp: "529211191936",
      warrantyDays: 30,
      noticesJson: [
        {
          id: "warranty",
          title: "30 días de garantía",
          text: "Garantía comercial de 30 días sobre el equipo adquirido.",
        },
      ],
    });
    console.log("Configuración comercial inicializada");
  }

  // 3. Crear un iPhone de prueba publicado (VC-060)
  if (process.env.SEED_DEMO !== "true") return;
  const existingProduct = await db.orm.public.Product.where({
    sku: "VC-001",
  }).first();

  if (!existingProduct) {
    const product = await db.orm.public.Product.create({
      sku: "VC-001",
      name: "iPhone 15 Pro",
      storage: "256 GB",
      color: "Titanio natural",
      battery: "98%",
      price: 22990,
      status: "Disponible",
      condition: "seminuevo",
      conditionNote: "Excelente",
      warrantyDays: 30,
      physicalCondition: "Excelente",
      screenCondition: "Original · Sin detalles",
      cameraStatus: "Funcionamiento correcto",
      biometric: "FACE_ID",
      unlockStatus: "Liberado",
      repairHistory: "Sin reparaciones conocidas",
      accessories: "Cable USB-C",
      observations: "",
      description:
        "Titanio de calidad aeroespacial, cámara Pro y rendimiento extraordinario. Equipo cuidadosamente revisado.",
      verifiedNotRefurbished: true,
      verifiedNoReplacedParts: true,
      techInfoVerified: true,
      isPublished: true,
    });

    await db.orm.public.ProductPhoto.create({
      productId: product.id,
      url: "https://images.unsplash.com/photo-1697636979316-cc18d4369e66?auto=format&fit=crop&w=1200&q=88",
      storageKey: "demo/vc-001.jpg",
      sortOrder: 0,
    });

    console.log("Producto inicial VC-001 creado");
  }
}

main()
  .then(() => db.close())
  .catch((err) => {
    console.error("Error en seed:", err instanceof Error ? err.message : "Error");
    process.exitCode = 1;
    return db.close();
  });
