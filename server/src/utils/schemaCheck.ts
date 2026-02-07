
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

interface MigrationStatus {
  upToDate: boolean;
  applied: string[];
  pending: string[];
  missing: string[]; // Applied in DB but missing in code (unlikely but possible)
  error?: string;
}

export async function checkSchemaStatus(): Promise<MigrationStatus> {
  try {
    // 1. Get applied migrations from DB
    const appliedMigrationsRaw = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM _prisma_migrations 
      WHERE rolled_back_at IS NULL
      ORDER BY started_at ASC
    `;
    const appliedNames = appliedMigrationsRaw.map(m => m.migration_name);

    // 2. Get available migrations from file system
    // Try to resolve prisma/migrations directory
    const possiblePaths = [
      path.resolve(process.cwd(), 'prisma/migrations'),
      path.resolve(process.cwd(), 'server/prisma/migrations'),
      path.resolve(__dirname, '../../prisma/migrations'), // from src/utils
      path.resolve(__dirname, '../../../prisma/migrations'), // from dist/server/src/utils
    ];

    let migrationsDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        migrationsDir = p;
        break;
      }
    }

    if (!migrationsDir) {
        return {
            upToDate: false,
            applied: appliedNames,
            pending: [],
            missing: [],
            error: 'Could not locate prisma/migrations directory'
        };
    }

    const availableNames = fs.readdirSync(migrationsDir)
      .filter(item => {
        const fullPath = path.join(migrationsDir, item);
        return fs.statSync(fullPath).isDirectory() && /^\d+_.+$/.test(item);
      })
      .sort();

    // 3. Compare
    const appliedSet = new Set(appliedNames);
    const availableSet = new Set(availableNames);

    const pending = availableNames.filter(name => !appliedSet.has(name));
    const missing = appliedNames.filter(name => !availableSet.has(name));

    return {
      upToDate: pending.length === 0,
      applied: appliedNames,
      pending,
      missing,
    };

  } catch (error) {
    return {
      upToDate: false,
      applied: [],
      pending: [],
      missing: [],
      error: error instanceof Error ? error.message : 'Unknown error checking schema status'
    };
  }
}
