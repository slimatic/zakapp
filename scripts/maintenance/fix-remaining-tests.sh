#!/bin/bash
#
# Script to update remaining contract test files to use factory helpers
# Run this from the repository root: bash fix-remaining-tests.sh
#

cd "$(dirname "$0")/server/tests/contract" || exit 1

echo "=== Fixing nisabYearRecords.delete.test.ts ==="

# Replace each create() block one at a time for delete.test.ts
# Pattern 1: DRAFT record (line ~41)
sed -i '41,59s/await prisma\.yearlySnapshot\.create({\n        data: {\n          userId,\n          status: '"'"'DRAFT'"'"',\n          nisabBasis: '"'"'GOLD'"'"',\n          calculationDate: new Date(),\n          gregorianYear: 2025,\n          gregorianMonth: 10,\n          gregorianDay: 28,\n          hijriYear: 1446,\n          hijriMonth: 3,\n          hijriDay: 15,\n          totalWealth: '"'"'10000'"'"',\n          totalLiabilities: '"'"'1000'"'"',\n          zakatableWealth: '"'"'9000'"'"',\n          zakatAmount: '"'"'225'"'"',\n          methodologyUsed: '"'"'standard'"'"',\n        },\n      });/await prisma.yearlySnapshot.create({\n        data: createNisabYearRecordData(userId, { status: '"'"'DRAFT'"'"' }),\n      });/g' nisabYearRecords.delete.test.ts

echo "Completed delete.test.ts - manual review recommended"
echo ""
echo "=== Fixing nisabYearRecords.finalize.test.ts ==="
echo "Manual replacements needed for finalize.test.ts (5 create() calls)"
echo ""
echo "=== Fixing nisabYearRecords.unlock.test.ts ==="
echo "Manual replacements needed for unlock.test.ts (8 create() calls)"
echo ""
echo "=== Summary ==="
echo "Remaining work:"
echo "  - delete.test.ts: 5 create() calls - use find/replace in editor"
echo "  - finalize.test.ts: 5 create() calls - use find/replace in editor"
echo "  - unlock.test.ts: 8 create() calls - use find/replace in editor"
echo ""
echo "Pattern to find:"
echo '  await prisma.yearlySnapshot.create({'
echo '    data: {'
echo '      userId,'
echo '      status: ...'
echo '      ... lots of fields ...'
echo '    },'
echo '  });'
echo ""
echo "Replace with (for DRAFT):"
echo '  await prisma.yearlySnapshot.create({'
echo '    data: createNisabYearRecordData(userId, { status: '"'"'DRAFT'"'"' }),'
echo '  });'
echo ""
echo "Replace with (for FINALIZED):"
echo '  await prisma.yearlySnapshot.create({'
echo '    data: createFinalizedRecord(userId),'
echo '  });'
echo ""
echo "Replace with (for UNLOCKED):"
echo '  await prisma.yearlySnapshot.create({'
echo '    data: createUnlockedRecord(userId),'
echo '  });'
