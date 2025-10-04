#!/bin/bash

# ZakApp API Load Testing Script
# Uses 'hey' HTTP load testing tool

set -e

API_BASE="http://localhost:3002"
HEY="/tmp/hey"
RESULTS_DIR="./results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        ZakApp API Performance Load Testing            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to run load test
run_load_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local requests=$4
    local concurrency=$5
    local data=$6
    local headers=$7
    
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Test: $test_name${NC}"
    echo -e "${BLUE}Endpoint: $method $endpoint${NC}"
    echo -e "${BLUE}Requests: $requests | Concurrency: $concurrency${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    local output_file="$RESULTS_DIR/${test_name// /_}_${TIMESTAMP}.txt"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$headers" ]; then
            $HEY -n "$requests" -c "$concurrency" $headers "$API_BASE$endpoint" | tee "$output_file"
        else
            $HEY -n "$requests" -c "$concurrency" "$API_BASE$endpoint" | tee "$output_file"
        fi
    else
        if [ -n "$headers" ]; then
            $HEY -n "$requests" -c "$concurrency" -m "$method" $headers -d "$data" "$API_BASE$endpoint" | tee "$output_file"
        else
            $HEY -n "$requests" -c "$concurrency" -m "$method" -T "application/json" -d "$data" "$API_BASE$endpoint" | tee "$output_file"
        fi
    fi
    
    # Add delay between tests to avoid rate limiting
    sleep 2
    
    echo -e "${GREEN}✓ Results saved to: $output_file${NC}"
}

# Test 1: Health Check (Baseline)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 1: Baseline Health Check Tests                   ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_load_test \
    "Health Check Baseline" \
    "GET" \
    "/health" \
    100 \
    5 \
    "" \
    ""

# Test 2: User Registration
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 2: Authentication Performance Tests              ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

# Note: Registration endpoint will have unique emails per request (timestamp-based)
# This is a simplified test since each request needs unique email
UNIQUE_TIMESTAMP=$(date +%s)
run_load_test \
    "User Registration" \
    "POST" \
    "/api/auth/register" \
    50 \
    2 \
    "{\"email\":\"load${UNIQUE_TIMESTAMP}@test.com\",\"username\":\"user${UNIQUE_TIMESTAMP}\",\"password\":\"TestPass123!\",\"confirmPassword\":\"TestPass123!\"}" \
    '-T "application/json"'

# Test 3: User Login (will need a real user first)
echo -e "\n${YELLOW}Note: Login test requires pre-existing user account${NC}"
echo -e "${YELLOW}Creating test user for login performance test...${NC}"

# Create test user
TEST_EMAIL="perftest_$(date +%s)@example.com"
TEST_USERNAME="perftest$(date +%s)"
TEST_PASSWORD="TestPass123!"

curl -s -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\",\"confirmPassword\":\"$TEST_PASSWORD\"}" \
    > /dev/null 2>&1

echo -e "${GREEN}✓ Test user created: $TEST_EMAIL${NC}"

run_load_test \
    "User Login" \
    "POST" \
    "/api/auth/login" \
    200 \
    5 \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    '-T "application/json"'

# Get auth token for authenticated endpoints
echo -e "\n${YELLOW}Obtaining authentication token...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

AUTH_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}✗ Failed to obtain auth token${NC}"
    echo -e "${RED}Response: $AUTH_RESPONSE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authentication token obtained${NC}"

# Test 4: Get Assets (Authenticated)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 3: Asset Management Performance Tests            ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_load_test \
    "Get Assets List" \
    "GET" \
    "/api/assets" \
    200 \
    5 \
    "" \
    "-H \"Authorization: Bearer $AUTH_TOKEN\""

# Test 5: Create Asset (Authenticated)
run_load_test \
    "Create Asset" \
    "POST" \
    "/api/assets" \
    100 \
    3 \
    '{"name":"Test Asset","category":"cash","value":1000,"currency":"USD","description":"Load test asset"}' \
    "-T \"application/json\" -H \"Authorization: Bearer $AUTH_TOKEN\""

# Test 6: Zakat Calculation (Authenticated)
echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Phase 4: Zakat Calculation Performance Tests           ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

run_load_test \
    "Zakat Calculation" \
    "POST" \
    "/api/zakat/calculate" \
    100 \
    3 \
    '{"methodologyId":"standard","includedAssetIds":[],"customAssets":[{"category":"cash","value":100000}]}' \
    "-T \"application/json\" -H \"Authorization: Bearer $AUTH_TOKEN\""

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Performance Testing Complete!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${BLUE}Results saved to: $RESULTS_DIR${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo ""

# Generate summary report
SUMMARY_FILE="$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "ZakApp API Performance Test Summary" > "$SUMMARY_FILE"
echo "Generated: $(date)" >> "$SUMMARY_FILE"
echo "=======================================" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

for result_file in "$RESULTS_DIR"/*_${TIMESTAMP}.txt; do
    if [ -f "$result_file" ]; then
        echo "File: $(basename $result_file)" >> "$SUMMARY_FILE"
        grep -E "Requests/sec|Average|95th percentile|99th percentile" "$result_file" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
    fi
done

echo -e "${GREEN}Summary report: $SUMMARY_FILE${NC}"
echo ""
