/**
 * Migration helper: convert AssetSnapshot -> YearlySnapshot (Nisab Year Record)
 *
 * Safe by default (dry-run). Run with `--apply` to persist.
 *
 * Usage:
 *  node -r ts-node/register prisma/migrations/migrate-snapshots-to-nisab.ts --dry-run
 *  ts-node --transpile-only prisma/migrations/migrate-snapshots-to-nisab.ts --apply
 */

import { PrismaClient } from '@prisma/client';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const argv = yargs(hideBin(process.argv))
  .option('apply', {
    type: 'boolean',
    description: 'Persist changes (default is dry-run)'
  })
  .help()
  .argv;

function toGregorianParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

async function migrate() {
  try {
    console.log('🔎 Scanning AssetSnapshot records for migration...');

    const snapshots = await prisma.assetSnapshot.findMany({
      where: {},
      select: {
        id: true,
        userId: true,
        snapshotDate: true,
        name: true,
        description: true,
        totalValue: true,
        assetsData: true,
        liabilitiesData: true,
        isLocked: true,
        createdAt: true
      }
    });

    console.log(`Found ${snapshots.length} AssetSnapshot records.`);

    let toCreate = [] as any[];

    for (const s of snapshots) {
      // Skip if a YearlySnapshot with same user and date already exists
      const existing = await prisma.yearlySnapshot.findFirst({
        where: {
          userId: s.userId,
          calculationDate: s.snapshotDate
        }
      });

      if (existing) {
        console.log(`- Skipping AssetSnapshot ${s.id} (YearlySnapshot exists: ${existing.id})`);
        continue;
      }

      const { year, month, day } = toGregorianParts(new Date(s.snapshotDate));

      const record = {
        userId: s.userId,
        calculationDate: s.snapshotDate,
        gregorianYear: year,
        gregorianMonth: month,
        gregorianDay: day,
        totalWealth: s.totalValue ? String(s.totalValue) : null,
        assetBreakdown: s.assetsData || null,
        calculationDetails: s.description || null,
        status: s.isLocked ? 'FINALIZED' : 'DRAFT',
        isPrimary: false,
        createdAt: s.createdAt
      } as any;

      toCreate.push({ assetSnapshotId: s.id, record });
    }

    console.log(`
📋 Prepared ${toCreate.length} YearlySnapshot (Nisab) records for creation.`);

    if (!argv.apply) {
      console.log('\nDry-run mode (no writes). To persist, re-run with --apply');

      // Write a planned CSV mapping for review (no created ids)
      try {
        const csvPathDry = path.join(process.cwd(), 'prisma', 'migrations', 'migrate-snapshots-to-nisab-planned.csv');
        const plannedCsv = ['assetSnapshotId,yearlySnapshotId,status']
          .concat(toCreate.map((t) => `${t.assetSnapshotId},,planned`))
          .join('\n');
        fs.writeFileSync(csvPathDry, plannedCsv, 'utf8');
        console.log(`Planned mapping written to ${csvPathDry}`);
      } catch (err) {
        console.warn('Failed to write planned CSV mapping:', err);
      }

      // Create a MigrationRecord entry in PENDING state for audit (dry-run)
      try {
        await prisma.migrationRecord.create({
          data: {
            migrationName: 'migrate-snapshots-to-nisab',
            sourceType: 'ASSET_DATA',
            sourceLocation: 'asset_snapshots',
            recordCount: toCreate.length,
            successCount: 0,
            failureCount: 0,
            checksumBefore: '',
            migrationLog: JSON.stringify({ planned: toCreate.length }),
            status: 'PENDING'
          }
        });
        console.log('MigrationRecord (PENDING) created (dry-run)');
      } catch (err) {
        console.warn('Failed to create MigrationRecord (dry-run):', err);
        // Fallback: some SQLite setups store DateTime values as integers which
        // can cause Prisma to error when reading back the created row. Try a
        // raw SQL insert that sets `startedAt` using SQLite's datetime('now')
        // function so the stored value is an ISO-like text string and Prisma
        // won't choke when reading it.
        try {
          const logStr = JSON.stringify({ planned: toCreate.length }).replace(/'/g, "''");
          await prisma.$executeRawUnsafe(`INSERT INTO migration_records (id, migrationName, sourceType, sourceLocation, recordCount, successCount, failureCount, checksumBefore, migrationLog, status, startedAt) VALUES (lower(hex(randomblob(16))), 'migrate-snapshots-to-nisab', 'ASSET_DATA', 'asset_snapshots', ${toCreate.length}, 0, 0, '', '${logStr}', 'PENDING', datetime('now'))`);
          console.log('MigrationRecord (PENDING) created via raw SQL (dry-run)');
        } catch (err2) {
          console.warn('Failed raw insert of MigrationRecord (dry-run):', err2);
        }
      }

      return { planned: toCreate.length };
    }

    console.log('\n✍️ Persisting records to YearlySnapshot (nisab_year_records)...');
    let created = 0;
    const results: Array<{ assetSnapshotId: string; yearlyId?: string; error?: string }> = [];
    for (const item of toCreate) {
      try {
        const createdRecord = await prisma.yearlySnapshot.create({
          data: {
            userId: item.record.userId,
            calculationDate: item.record.calculationDate,
            gregorianYear: item.record.gregorianYear,
            gregorianMonth: item.record.gregorianMonth,
            gregorianDay: item.record.gregorianDay,
            // Hijri fields are required by the Prisma schema; legacy snapshots
            // may not have Hijri data so default to 0 (will be safe placeholder)
            hijriYear: 0,
            hijriMonth: 0,
            hijriDay: 0,
            totalWealth: item.record.totalWealth || '0',
            // Required fields in schema — provide safe defaults when source
            // snapshot doesn't include them.
            totalLiabilities: item.record.totalLiabilities || '0',
            zakatableWealth: item.record.zakatableWealth || '0',
            zakatAmount: item.record.zakatAmount || '0',
            methodologyUsed: item.record.methodologyUsed || 'standard',
            nisabThreshold: item.record.nisabThreshold || '',
            nisabType: item.record.nisabType || '',
            assetBreakdown: item.record.assetBreakdown,
            calculationDetails: item.record.calculationDetails,
            status: item.record.status,
            isPrimary: item.record.isPrimary,
            createdAt: item.record.createdAt
          }
        });

        console.log(`✅ Created YearlySnapshot ${createdRecord.id} for AssetSnapshot ${item.assetSnapshotId}`);
        created++;
        results.push({ assetSnapshotId: item.assetSnapshotId, yearlyId: createdRecord.id });
      } catch (err) {
        console.error(`❌ Failed to create YearlySnapshot for AssetSnapshot ${item.assetSnapshotId}:`, err);
        // Fallback: attempt raw SQL insert into nisab_year_records to avoid
        // Prisma DateTime/validation errors caused by existing inconsistent
        // DB values or schema mismatches in some environments.
        try {
          const id = (await prisma.$queryRawUnsafe("SELECT lower(hex(randomblob(16))) as id"))[0]?.id || null;
          const createdAt = item.record.createdAt ? new Date(item.record.createdAt).toISOString() : new Date().toISOString();
          const calcDate = new Date(item.record.calculationDate).toISOString();
          const gregYear = item.record.gregorianYear || 0;
          const gregMonth = item.record.gregorianMonth || 0;
          const gregDay = item.record.gregorianDay || 0;
          const totalWealth = (item.record.totalWealth || '0').replace(/'/g, "''");
          const totalLiabilities = (item.record.totalLiabilities || '0').replace(/'/g, "''");
          const zakatableWealth = (item.record.zakatableWealth || '0').replace(/'/g, "''");
          const zakatAmount = (item.record.zakatAmount || '0').replace(/'/g, "''");
          const methodologyUsed = (item.record.methodologyUsed || 'standard').replace(/'/g, "''");
          const nisabThreshold = (item.record.nisabThreshold || '').replace(/'/g, "''");
          const nisabType = (item.record.nisabType || '').replace(/'/g, "''");
          const assetBreakdown = (item.record.assetBreakdown || '').replace(/'/g, "''");
          const calculationDetails = (item.record.calculationDetails || '').replace(/'/g, "''");
          const status = (item.record.status || 'DRAFT');
          const isPrimary = item.record.isPrimary ? 1 : 0;

          const sql = `INSERT INTO nisab_year_records (id, userId, calculationDate, gregorianYear, gregorianMonth, gregorianDay, hijriYear, hijriMonth, hijriDay, totalWealth, totalLiabilities, zakatableWealth, zakatAmount, methodologyUsed, nisabThreshold, nisabType, status, assetBreakdown, calculationDetails, isPrimary, createdAt, updatedAt) VALUES ('${id}', '${item.record.userId}', '${calcDate}', ${gregYear}, ${gregMonth}, ${gregDay}, 0, 0, 0, '${totalWealth}', '${totalLiabilities}', '${zakatableWealth}', '${zakatAmount}', '${methodologyUsed}', '${nisabThreshold}', '${nisabType}', '${status}', '${assetBreakdown}', '${calculationDetails}', ${isPrimary}, '${createdAt}', datetime('now'))`;

          await prisma.$executeRawUnsafe(sql);
          console.log(`✅ Raw-inserted YearlySnapshot ${id} for AssetSnapshot ${item.assetSnapshotId}`);
          created++;
          results.push({ assetSnapshotId: item.assetSnapshotId, yearlyId: id });
        } catch (err2) {
          console.error(`❌ Raw-insert fallback failed for AssetSnapshot ${item.assetSnapshotId}:`, err2);
          results.push({ assetSnapshotId: item.assetSnapshotId, error: String(err?.message || err) });
        }
      }
    }

    console.log(`\nMigration complete. Created ${created} records.`);

    // Write mapping CSV with results
    try {
      const csvPath = path.join(process.cwd(), 'prisma', 'migrations', 'migrate-snapshots-to-nisab-mapping.csv');
      const rows = ['assetSnapshotId,yearlySnapshotId,status,error'];
      for (const r of results) {
        const yearly = r.yearlyId || '';
        const status = r.yearlyId ? 'created' : 'failed';
        const err = r.error ? `"${r.error.replace(/"/g, '""')}"` : '';
        rows.push(`${r.assetSnapshotId},${yearly},${status},${err}`);
      }
      fs.writeFileSync(csvPath, rows.join('\n'), 'utf8');
      console.log(`Mapping CSV written to ${csvPath}`);
    } catch (err) {
      console.warn('Failed to write mapping CSV:', err);
    }

    // Create MigrationRecord entry for audit
    try {
      await prisma.migrationRecord.create({
        data: {
          migrationName: 'migrate-snapshots-to-nisab',
          sourceType: 'ASSET_DATA',
          sourceLocation: 'asset_snapshots',
          recordCount: toCreate.length,
          successCount: created,
          failureCount: toCreate.length - created,
          checksumBefore: '',
          migrationLog: JSON.stringify({ created, failed: toCreate.length - created }),
          status: toCreate.length - created === 0 ? 'COMPLETED' : (created > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED')
        }
      });
      console.log('MigrationRecord created');
    } catch (err) {
      console.warn('Failed to create MigrationRecord:', err);
      // Fallback: insert via raw SQL using SQLite datetime('now') in case of
      // inconsistent existing column formats (e.g., numeric epoch values
      // stored in `startedAt` causing Prisma to fail during readback).
      try {
        const logStr = JSON.stringify({ created, failed: toCreate.length - created }).replace(/'/g, "''");
        await prisma.$executeRawUnsafe(`INSERT INTO migration_records (id, migrationName, sourceType, sourceLocation, recordCount, successCount, failureCount, checksumBefore, migrationLog, status, startedAt, completedAt, duration) VALUES (lower(hex(randomblob(16))), 'migrate-snapshots-to-nisab', 'ASSET_DATA', 'asset_snapshots', ${toCreate.length}, ${created}, ${toCreate.length - created}, '', '${logStr}', '${toCreate.length - created === 0 ? 'COMPLETED' : (created > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED')}', datetime('now'), datetime('now'), 0)`);
        console.log('MigrationRecord created via raw SQL fallback');
      } catch (err2) {
        console.warn('Failed raw insert of MigrationRecord:', err2);
      }
    }

    return { planned: toCreate.length, created };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrate()
    .then((r) => process.exit(0))
    .catch((err) => {
      console.error('Migration helper failed:', err);
      process.exit(1);
    });
}

export default migrate;
