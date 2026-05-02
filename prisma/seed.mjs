import { randomBytes, scryptSync } from "node:crypto";
import { InternalAdminRoleKey, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const SCRYPT_KEY_LEN = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function hashPasswordS1(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

function hashPasswordS2(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return `s2$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function normalizeRole(input) {
  const value = String(input || "SUPER_ADMIN").trim().toUpperCase();
  if (value === "SUPER_ADMIN") return UserRole.SUPER_ADMIN;
  if (value === "EDITOR") return UserRole.EDITOR;
  if (value === "AUTHOR") return UserRole.AUTHOR;
  return UserRole.SUPER_ADMIN;
}

function normalizeInternalRole(input) {
  const value = String(input || "SUPERADMIN")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (value === "SUPERADMIN") return InternalAdminRoleKey.SUPERADMIN;
  if (value === "ADMIN") return InternalAdminRoleKey.ADMIN;
  if (value === "VISUALIZADOR" || value === "VIEWER") {
    return InternalAdminRoleKey.VISUALIZADOR;
  }
  return InternalAdminRoleKey.SUPERADMIN;
}

async function main() {
  const roles = [
    { key: UserRole.SUPER_ADMIN, name: "Super Admin" },
    { key: UserRole.EDITOR, name: "Editor" },
    { key: UserRole.AUTHOR, name: "Author" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: role,
    });
  }

  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@credpago.local").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "ChangeMe_123!");
  const adminName = String(process.env.ADMIN_NAME || "Credpagos Admin").trim();
  const adminRoleKey = normalizeRole(process.env.ADMIN_ROLE);

  const adminRole = await prisma.role.findUnique({ where: { key: adminRoleKey } });
  if (!adminRole) {
    throw new Error("Role not found for admin seed.");
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      displayName: adminName,
      passwordHash: hashPasswordS1(adminPassword),
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: adminEmail,
      displayName: adminName,
      passwordHash: hashPasswordS1(adminPassword),
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const internalRoles = [
    { key: InternalAdminRoleKey.SUPERADMIN, name: "Superadmin" },
    { key: InternalAdminRoleKey.ADMIN, name: "Admin" },
    { key: InternalAdminRoleKey.VISUALIZADOR, name: "Visualizador" },
  ];

  for (const role of internalRoles) {
    await prisma.internalAdminRole.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: role,
    });
  }

  const internalEmail = String(process.env.INTERNAL_ADMIN_EMAIL || adminEmail)
    .trim()
    .toLowerCase();
  const internalPassword = String(process.env.INTERNAL_ADMIN_PASSWORD || adminPassword);
  const internalName = String(process.env.INTERNAL_ADMIN_NAME || adminName).trim();
  const internalRoleKey = normalizeInternalRole(process.env.INTERNAL_ADMIN_ROLE);

  const internalRole = await prisma.internalAdminRole.findUnique({
    where: { key: internalRoleKey },
  });
  if (!internalRole) {
    throw new Error("Internal role not found for internal admin seed.");
  }

  await prisma.internalAdminUser.upsert({
    where: { email: internalEmail },
    update: {
      fullName: internalName,
      passwordHash: hashPasswordS2(internalPassword),
      roleId: internalRole.id,
      isActive: true,
      lockedUntil: null,
      failedLoginCount: 0,
      deletedAt: null,
      lastPasswordChangeAt: new Date(),
    },
    create: {
      email: internalEmail,
      fullName: internalName,
      passwordHash: hashPasswordS2(internalPassword),
      roleId: internalRole.id,
      isActive: true,
      lastPasswordChangeAt: new Date(),
    },
  });

  const categorySeeds = [
    {
      name: "Atualizacoes Credpagos",
      slug: "atualizacoes-credpago",
      description: "Comunicados oficiais, lancamentos e novidades.",
      color: "#0ea5e9",
    },
    {
      name: "Seguranca",
      slug: "seguranca",
      description: "Boas praticas, hardening e compliance.",
      color: "#22c55e",
    },
    {
      name: "Mercado",
      slug: "mercado",
      description: "Analises de tendencias e movimentos do setor.",
      color: "#f59e0b",
    },
  ];

  for (const category of categorySeeds) {
    await prisma.newsCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  const tagSeeds = [
    { name: "produto", slug: "produto" },
    { name: "tecnologia", slug: "tecnologia" },
    { name: "seguranca", slug: "seguranca-tag" },
    { name: "escalabilidade", slug: "escalabilidade" },
  ];

  for (const tag of tagSeeds) {
    await prisma.newsTag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }

  console.log("Seed concluido com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
