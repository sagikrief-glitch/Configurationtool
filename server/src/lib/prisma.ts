import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';

// PrismaBetterSqlite3 adapter accepts { url } — resolves relative file: paths automatically
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
} as ConstructorParameters<typeof PrismaClient>[0]);
