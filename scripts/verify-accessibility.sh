#!/bin/bash

# Accessibility Verification Script
# Tests key accessibility features implemented in Phase 2

echo "🔍 Accessibility Verification Checklist"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 1. Checking Dependencies..."
echo "--------------------------------"

# Check if Radix UI packages are installed
if [ -d "client/node_modules/@radix-ui/react-dialog" ]; then
    echo -e "${GREEN}✅ @radix-ui/react-dialog installed${NC}"
else
    echo -e "${YELLOW}⚠️  @radix-ui/react-dialog NOT found${NC}"
fi

if [ -d "client/node_modules/@radix-ui/react-tooltip" ]; then
    echo -e "${GREEN}✅ @radix-ui/react-tooltip installed${NC}"
else
    echo -e "${YELLOW}⚠️  @radix-ui/react-tooltip NOT found${NC}"
fi

if [ -d "client/node_modules/@radix-ui/react-dropdown-menu" ]; then
    echo -e "${GREEN}✅ @radix-ui/react-dropdown-menu installed${NC}"
else
    echo -e "${YELLOW}⚠️  @radix-ui/react-dropdown-menu NOT found${NC}"
fi

echo ""
echo "📁 2. Checking Component Files..."
echo "--------------------------------"

components=(
    "client/src/components/common/SkipLink.tsx"
    "client/src/components/common/Modal.tsx"
    "client/src/components/common/Tooltip.tsx"
    "client/src/components/common/DropdownMenu.tsx"
    "client/src/components/common/AccessibleTable.tsx"
    "client/src/components/charts/AccessibleChart.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ $(basename $component)${NC}"
    else
        echo -e "${YELLOW}⚠️  $(basename $component) NOT found${NC}"
    fi
done

echo ""
echo "🎨 3. Checking Styles..."
echo "--------------------------------"

if [ -f "client/src/styles/accessibility.css" ]; then
    echo -e "${GREEN}✅ accessibility.css exists${NC}"
    lines=$(wc -l < "client/src/styles/accessibility.css")
    echo "   → $lines lines of accessibility styles"
else
    echo -e "${YELLOW}⚠️  accessibility.css NOT found${NC}"
fi

# Check if accessibility.css is imported
if grep -q "accessibility.css" "client/src/index.tsx"; then
    echo -e "${GREEN}✅ accessibility.css imported in index.tsx${NC}"
else
    echo -e "${YELLOW}⚠️  accessibility.css NOT imported${NC}"
fi

echo ""
echo "🌐 4. Checking HTML..."
echo "--------------------------------"

if grep -q 'lang="en"' "client/public/index.html"; then
    echo -e "${GREEN}✅ Language declaration (lang=\"en\") present${NC}"
else
    echo -e "${YELLOW}⚠️  Language declaration missing${NC}"
fi

if grep -q 'ZakApp' "client/public/index.html"; then
    echo -e "${GREEN}✅ Page title updated${NC}"
else
    echo -e "${YELLOW}⚠️  Page title not updated${NC}"
fi

echo ""
echo "🔧 5. Checking Configuration..."
echo "--------------------------------"

if grep -q "zakat-green" "client/tailwind.config.js"; then
    echo -e "${GREEN}✅ Tailwind color palette extended${NC}"
else
    echo -e "${YELLOW}⚠️  Tailwind colors not updated${NC}"
fi

echo ""
echo "📝 6. Component Usage Check..."
echo "--------------------------------"

# Check if SkipLink is used in Layout
if grep -q "SkipLink" "client/src/components/layout/Layout.tsx"; then
    echo -e "${GREEN}✅ SkipLink imported and used in Layout${NC}"
else
    echo -e "${YELLOW}⚠️  SkipLink not used in Layout${NC}"
fi

# Check for ARIA attributes in AssetForm
if grep -q "aria-required" "client/src/components/assets/AssetForm.tsx"; then
    echo -e "${GREEN}✅ ARIA attributes in AssetForm${NC}"
else
    echo -e "${YELLOW}⚠️  ARIA attributes missing in AssetForm${NC}"
fi

# Check for semantic HTML in Dashboard
if grep -q "<main" "client/src/pages/Dashboard.tsx"; then
    echo -e "${GREEN}✅ Semantic HTML in Dashboard${NC}"
else
    echo -e "${YELLOW}⚠️  Semantic HTML missing in Dashboard${NC}"
fi

echo ""
echo "🧪 7. Manual Testing Checklist"
echo "--------------------------------"
echo "[ ] Tab on page → Skip link appears"
echo "[ ] Tab through navigation → Focus visible"
echo "[ ] Enter/Space on dropdown → Opens menu"
echo "[ ] Escape key → Closes modals/dropdowns"
echo "[ ] Form errors → Announced by screen reader"
echo "[ ] All interactive elements → Keyboard accessible"
echo ""

echo "🎯 8. Recommended Next Steps"
echo "--------------------------------"
echo "1. Start dev server: cd client && npm start"
echo "2. Open browser: http://localhost:3000"
echo "3. Test keyboard navigation (Tab, Enter, Space, Escape)"
echo "4. Run Lighthouse audit: DevTools → Lighthouse → Accessibility"
echo "5. Test with screen reader (NVDA/JAWS/VoiceOver)"
echo "6. Install browser extension: axe DevTools"
echo "7. Run automated tests: npm test"
echo ""

echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
