#!/usr/bin/env python3
"""
Script to update contract test files to use factory helpers.
This replaces prisma.yearlySnapshot.create() calls with factory function calls.
"""

import re
from pathlib import Path

CONTRACT_DIR = Path(__file__).parent.parent.parent / "server" / "tests" / "contract"

# Pattern to match the entire create block
CREATE_PATTERN = re.compile(
    r'await prisma\.yearlySnapshot\.create\(\{\s*'
    r'data:\s*\{([^}]+?)\}\s*,?\s*'
    r'\}\);',
    re.DOTALL
)

def get_status_from_data(data_block):
    """Extract status from data block"""
    match = re.search(r"status:\s*'(\w+)'", data_block)
    return match.group(1) if match else 'DRAFT'

def replace_create_call(match):
    """Replace create() call with factory helper"""
    data_block = match.group(1)
    status = get_status_from_data(data_block)
    
    if status == 'FINALIZED':
        return "await prisma.yearlySnapshot.create({\n        data: createFinalizedRecord(userId),\n      });"
    elif status == 'UNLOCKED':
        return "await prisma.yearlySnapshot.create({\n        data: createUnlockedRecord(userId),\n      });"
    else:  # DRAFT or default
        return f"await prisma.yearlySnapshot.create({{\n        data: createNisabYearRecordData(userId, {{ status: '{status}' }}),\n      }});"

def update_file(filepath):
    """Update a single test file"""
    print(f"Processing {filepath.name}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Count matches before replacement
    matches = list(CREATE_PATTERN.finditer(content))
    if not matches:
        print(f"  No create() calls found")
        return False
    
    print(f"  Found {len(matches)} create() calls")
    
    # Replace all matches
    updated_content = CREATE_PATTERN.sub(replace_create_call, content)
    
    if updated_content != original_content:
        with open(filepath, 'w') as f:
            f.write(updated_content)
        print(f"  ✓ Updated {len(matches)} create() calls")
        return True
    else:
        print(f"  No changes needed")
        return False

def main():
    """Main function"""
    files_to_update = [
        "nisabYearRecords.delete.test.ts",
        "nisabYearRecords.finalize.test.ts",
        "nisabYearRecords.unlock.test.ts",
    ]
    
    print("=" * 60)
    print("Updating contract test files to use factory helpers")
    print("=" * 60)
    print()
    
    updated_count = 0
    for filename in files_to_update:
        filepath = CONTRACT_DIR / filename
        if filepath.exists():
            if update_file(filepath):
                updated_count += 1
        else:
            print(f"⚠ File not found: {filename}")
        print()
    
    print("=" * 60)
    print(f"Updated {updated_count} files")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Review the changes: git diff server/tests/contract/")
    print("2. Run TypeScript check: npx tsc --noEmit")
    print("3. Commit changes: git add -A && git commit -m 'fix(008): Update remaining contract tests to use factory'")

if __name__ == "__main__":
    main()
