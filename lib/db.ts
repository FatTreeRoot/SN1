import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. This database holds operational data only —
 * see prisma/schema.prisma for the hard constraint.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logging stays off in every environment: even parameter logging
    // is a channel confidential content must never reach.
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
