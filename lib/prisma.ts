import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Prisma Client Singleton
 * Prevents multiple instances during Hot Module Replacement in development
 * 
 * In Prisma 7, we need to use a driver adapter for serverless environments.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Please set it in your .env.local file or environment variables.\n' +
    'Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname'
  );
}

// Create PostgreSQL pool for Prisma adapter
// Configured with explicit connection limits for Render.com starter plan
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
  max: 15, // Prisma pool limit (leaves room for main pool)
  min: 2, // Keep minimum connections alive for connection reuse
  connectionTimeoutMillis: 10000, // 10 seconds to establish new connection
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  // Note: statement_timeout is set per-connection via SQL, not pool config
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Store in global for HMR in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Gracefully disconnect on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

