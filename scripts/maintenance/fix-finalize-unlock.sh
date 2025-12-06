#!/bin/bash
# Batch update finalize.test.ts and unlock.test.ts
# Run from repository root

cd server/tests/contract

echo "Updating finalize.test.ts..."

# This sed script replaces create blocks that match the old pattern with factory calls
# It processes the file line by line, looking for specific patterns

cat >  /tmp/fix-finalize.sed << 'SED_EOF'
# Match the start of create blocks and replace with factory pattern
/await prisma\.yearlySnapshot\.create({/{
    # Read ahead to capture the full block
    :loop
    n
    /^      });$/!b loop
    # Now we've captured the block, replace it based on what we found
    # For DRAFT records
    s/.*createNisabYearRecordData(userId, { status: 'DRAFT' }),\n      });/g
}
SED_EOF

echo "Manual update recommended for finalize.test.ts and unlock.test.ts"
echo ""
echo "Remaining files need manual updates:"
echo "  - finalize.test.ts: 4 more create() calls (lines ~79, 120, 156, 190)"
echo "  - unlock.test.ts: 8 create() calls"
echo ""
echo "Use find-and-replace in VSCode:"
echo ""
echo "FIND (regex):"
echo "await prisma\\.yearlySnapshot\\.create\\(\\{\\s*data:\\s*\\{\\s*user:\\s*\\{\\s*connect:\\s*\\{\\s*id:\\s*userId\\s*\\}\\s*\\},\\s*status:\\s*'(\\w+)',\\s*[^}]+\\}\\s*as\\s*any,\\s*\\}\\);"
echo ""
echo "REPLACE:"
echo "await prisma.yearlySnapshot.create({\n        data: create\${1}Record(userId),\n      });"
echo ""
echo "Where \${1} will be DRAFT, FINALIZED, or UNLOCKED"
