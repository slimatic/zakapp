#!/bin/bash

# ZakApp Frontend Performance Testing with Lighthouse
# Tests Core Web Vitals and overall performance metrics

set -e

FRONTEND_URL="http://localhost:3000"
RESULTS_DIR="./results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ZakApp Frontend Performance Testing              ║${NC}"
echo -e "${BLUE}║              (Lighthouse Audit)                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run lighthouse audit
run_lighthouse() {
    local test_name=$1
    local url=$2
    local additional_flags=$3
    
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Test: $test_name${NC}"
    echo -e "${BLUE}URL: $url${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    local output_file="$RESULTS_DIR/${test_name// /_}_${TIMESTAMP}"
    
    lighthouse "$url" \
        --output=html \
        --output=json \
        --output-path="$output_file" \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --quiet \
        $additional_flags
    
    echo -e "${GREEN}✓ Results saved to: ${output_file}.html and ${output_file}.json${NC}"
}

# Check if frontend is running
echo -e "${BLUE}Checking if frontend is accessible...${NC}"
if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${RED}✗ Frontend is not accessible at $FRONTEND_URL${NC}"
    echo -e "${RED}Please ensure the frontend server is running on port 3000${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend is accessible${NC}"

# Test 1: Homepage Performance (Desktop)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 1: Homepage Performance (Desktop)                ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_lighthouse \
    "Homepage Desktop" \
    "$FRONTEND_URL" \
    "--preset=desktop"

# Test 2: Homepage Performance (Mobile)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 2: Homepage Performance (Mobile)                 ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_lighthouse \
    "Homepage Mobile" \
    "$FRONTEND_URL" \
    "--preset=mobile"

# Test 3: Performance Only (Fast check)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 3: Performance-Only Audit (Fast)                 ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_lighthouse \
    "Performance Only" \
    "$FRONTEND_URL" \
    "--only-categories=performance"

# Generate summary from JSON results
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Generating Performance Summary...                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

SUMMARY_FILE="$RESULTS_DIR/lighthouse_summary_${TIMESTAMP}.txt"
echo "ZakApp Frontend Performance Summary (Lighthouse)" > "$SUMMARY_FILE"
echo "Generated: $(date)" >> "$SUMMARY_FILE"
echo "=======================================" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

for json_file in "$RESULTS_DIR"/*_${TIMESTAMP}.report.json; do
    if [ -f "$json_file" ]; then
        test_name=$(basename "$json_file" | sed 's/_'$TIMESTAMP'.report.json//')
        echo "═══ $test_name ═══" >> "$SUMMARY_FILE"
        
        # Extract key metrics using jq if available, otherwise grep
        if command -v jq > /dev/null 2>&1; then
            echo "Performance Score: $(jq -r '.categories.performance.score * 100' "$json_file")%" >> "$SUMMARY_FILE"
            echo "First Contentful Paint: $(jq -r '.audits["first-contentful-paint"].displayValue' "$json_file")" >> "$SUMMARY_FILE"
            echo "Largest Contentful Paint: $(jq -r '.audits["largest-contentful-paint"].displayValue' "$json_file")" >> "$SUMMARY_FILE"
            echo "Total Blocking Time: $(jq -r '.audits["total-blocking-time"].displayValue' "$json_file")" >> "$SUMMARY_FILE"
            echo "Cumulative Layout Shift: $(jq -r '.audits["cumulative-layout-shift"].displayValue' "$json_file")" >> "$SUMMARY_FILE"
            echo "Speed Index: $(jq -r '.audits["speed-index"].displayValue' "$json_file")" >> "$SUMMARY_FILE"
        else
            echo "Performance Score: $(grep -o '"performance":{"id":"performance","score":[0-9.]*' "$json_file" | grep -o '[0-9.]*$' | awk '{print $1 * 100}')%" >> "$SUMMARY_FILE"
            echo "(Install 'jq' for detailed metrics)" >> "$SUMMARY_FILE"
        fi
        
        echo "" >> "$SUMMARY_FILE"
    fi
done

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Frontend Performance Testing Complete!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}Results saved to: $RESULTS_DIR${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo -e "\n${BLUE}HTML Reports:${NC}"
ls -1 "$RESULTS_DIR"/*_${TIMESTAMP}.report.html 2>/dev/null || echo "No HTML reports found"
echo -e "\n${GREEN}Summary report: $SUMMARY_FILE${NC}"
echo ""

# Display summary content
if [ -f "$SUMMARY_FILE" ]; then
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    cat "$SUMMARY_FILE"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
fi
