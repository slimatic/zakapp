/**
 * Data Transformation Script for Nisab Year Record Migration
 * 
 * Populates Hijri date fields for existing Nisab Year Records
 * Runs after Prisma migration completes
 */

import moment from 'moment-hijri';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Transform existing YearlySnapshot records to NisabYearRecord format
 * Specifically populates Hijri date fields that require calculation
 */
async function transformNisabYearRecords() {
  try {
    console.log('🔄 Starting Nisab Year Record data transformation...');

    // Get all records that need Hijri date population
    const records = await prisma.yearlySnapshot.findMany({
      where: {
        hawlStartDateHijri: null,
      },
      select: {
        id: true,
        hawlStartDate: true,
        hawlCompletionDate: true,
        calculationDate: true,
        userId: true,
      },
    });

    console.log(`📊 Found ${records.length} records to transform`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        // Calculate Hijri dates
        const hawlStartHijri = moment(record.hawlStartDate).format('iYYYY-iMM-iDD');
        const hawlCompletionHijri = moment(record.hawlCompletionDate).format('iYYYY-iMM-iDD');

        // Update record with Hijri dates
        await prisma.yearlySnapshot.update({
          where: { id: record.id },
          data: {
            hawlStartDateHijri: hawlStartHijri,
            hawlCompletionDateHijri: hawlCompletionHijri,
          },
        });

        successCount++;
        console.log(`✅ Transformed record ${record.id} to Hijri dates`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error transforming record ${record.id}:`, error);
      }
    }

    console.log(`\n📈 Transformation Complete:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0 && successCount > 0) {
      console.log(`\n✨ All records successfully transformed!`);
    } else if (records.length === 0) {
      console.log(`\n✨ No records needed transformation (already complete)`);
    }

    return { successCount, errorCount };
  } catch (error) {
    console.error('💥 Fatal error during transformation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run transformation if executed directly
if (require.main === module) {
  transformNisabYearRecords()
    .then(({ successCount, errorCount }) => {
      process.exit(errorCount > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default transformNisabYearRecords;
