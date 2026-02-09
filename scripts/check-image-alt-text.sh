#!/bin/bash

# T019: Check for Images Without Alt Text
# Validates all <img> tags and image components have alt attributes

echo "🔍 Checking for images without alt text..."
echo "=============================================="

# Find all TypeScript/TSX files
files=$(find client/src -type f \( -name "*.tsx" -o -name "*.ts" \))

# Track issues
issues_found=0
total_images=0

for file in $files; do
  # Check for <img> tags without alt
  missing_alt=$(grep -n '<img[^>]*\([^>]*alt\s*=\s*[^>]*\)\@!' "$file" 2>/dev/null || true)
  
  # Count total img tags
  img_count=$(grep -c '<img' "$file" 2>/dev/null || echo "0")
  total_images=$((total_images + img_count))
  
  if [ -n "$missing_alt" ]; then
    echo "❌ $file"
    echo "$missing_alt"
    issues_found=$((issues_found + 1))
  fi
done

echo ""
echo "Summary:"
echo "--------"
echo "Total images found: $total_images"
echo "Files with issues: $issues_found"

if [ $issues_found -eq 0 ]; then
  echo "✅ All images have alt text!"
  exit 0
else
  echo "⚠️  Some images are missing alt text"
  echo ""
  echo "Guidelines:"
  echo "- Decorative images: alt=\"\" or aria-hidden=\"true\""
  echo "- Informative images: alt=\"Description of what the image shows\""
  echo "- Functional images: alt=\"What happens when you click/interact\""
  exit 1
fi
