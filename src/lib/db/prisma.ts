import { PrismaClient } from "@prisma/client";

declare global {
  var __credpagoPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__credpagoPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__credpagoPrisma__ = prisma;
}