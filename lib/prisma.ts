/**
 * Prisma Client singleton — Tracing Tiny Paws (TTP)
 *
 * Prisma 7 requires a driver adapter for runtime database connections.
 * We use @prisma/adapter-pg (node-postgres) as the adapter for PostgreSQL.
 *
 * The singleton pattern prevents multiple PrismaClient instances during
 * Next.js hot-reload in development, which would exhaust the connection pool.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
