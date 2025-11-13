#!/bin/bash
# Manual Testing Helper Script for Nisab Year Record (T067-T073)
# This script helps automate some setup and verification steps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/home/lunareclipse/zakapp"
DB_PATH="$PROJECT_ROOT/server/zakapp.db"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Manual Testing Helper - Feature 008${NC}"
echo -e "${BLUE}Nisab Year Record Workflow${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if servers are running
check_servers() {
    echo -e "${YELLOW}Checking if servers are running...${NC}"
    
    BACKEND_PID=$(pgrep -f "node.*server" | head -1)
    FRONTEND_PID=$(pgrep -f "react-scripts" | head -1)
    
    if [ -z "$BACKEND_PID" ]; then
        echo -e "${RED}❌ Backend server is NOT running${NC}"
        echo -e "   Start with: cd $PROJECT_ROOT && npm run server:dev"
        return 1
    else
        echo -e "${GREEN}✅ Backend server is running (PID: $BACKEND_PID)${NC}"
    fi
    
    if [ -z "$FRONTEND_PID" ]; then
        echo -e "${RED}❌ Frontend server is NOT running${NC}"
        echo -e "   Start with: cd $PROJECT_ROOT && npm run client:dev"
        return 1
    else
        echo -e "${GREEN}✅ Frontend server is running (PID: $FRONTEND_PID)${NC}"
    fi
    
    echo ""
    return 0
}

# Function to check database
check_database() {
    echo -e "${YELLOW}Checking database...${NC}"
    
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ Database not found at $DB_PATH${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Database found${NC}"
    
    # Check tables
    TABLES=$(sqlite3 "$DB_PATH" ".tables" 2>/dev/null || echo "")
    if echo "$TABLES" | grep -q "nisab_year_records"; then
        echo -e "${GREEN}✅ nisab_year_records table exists${NC}"
    else
        echo -e "${RED}❌ nisab_year_records table NOT found${NC}"
        return 1
    fi
    
    if echo "$TABLES" | grep -q "precious_metal_prices"; then
        echo -e "${GREEN}✅ precious_metal_prices table exists${NC}"
    else
        echo -e "${YELLOW}⚠️  precious_metal_prices table NOT found (may be optional)${NC}"
    fi
    
    if echo "$TABLES" | grep -q "audit_trail_entries"; then
        echo -e "${GREEN}✅ audit_trail_entries table exists${NC}"
    else
        echo -e "${YELLOW}⚠️  audit_trail_entries table NOT found (may be optional)${NC}"
    fi
    
    echo ""
    return 0
}

# Function to display test user info
show_test_user() {
    echo -e "${YELLOW}Checking for test users...${NC}"
    
    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    if [ "$USER_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ $USER_COUNT user(s) found in database${NC}"
        echo ""
        echo -e "${BLUE}Available test users:${NC}"
        sqlite3 "$DB_PATH" "SELECT id, email, name FROM users LIMIT 5;" 2>/dev/null || echo "Error reading users"
    else
        echo -e "${RED}❌ No users found in database${NC}"
        echo -e "   Create a test user by:"
        echo -e "   1. Navigate to http://localhost:3000/register"
        echo -e "   2. Register with test credentials"
    fi
    
    echo ""
}

# Function to show current Nisab records
show_nisab_records() {
    echo -e "${YELLOW}Current Nisab Year Records:${NC}"
    
    RECORD_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM nisab_year_records;" 2>/dev/null || echo "0")
    if [ "$RECORD_COUNT" -gt 0 ]; then
        echo -e "${GREEN}Found $RECORD_COUNT record(s)${NC}"
        echo ""
        sqlite3 "$DB_PATH" "SELECT id, status, hawlStartDate, hawlCompletionDate FROM nisab_year_records;" 2>/dev/null || echo "Error reading records"
    else
        echo -e "${BLUE}No Nisab Year Records found (this is normal for first-time testing)${NC}"
    fi
    
    echo ""
}

# Function to simulate Hawl completion (for T070)
simulate_hawl_completion() {
    echo -e "${YELLOW}Simulating Hawl completion for testing...${NC}"
    echo -e "${BLUE}This will set hawlCompletionDate to yesterday for DRAFT records${NC}"
    echo ""
    
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Skipped${NC}"
        return 0
    fi
    
    YESTERDAY=$(date -d "yesterday" +"%Y-%m-%d")
    
    UPDATED=$(sqlite3 "$DB_PATH" "UPDATE nisab_year_records SET hawlCompletionDate='$YESTERDAY' WHERE status='DRAFT'; SELECT changes();" 2>/dev/null || echo "0")
    
    if [ "$UPDATED" -gt 0 ]; then
        echo -e "${GREEN}✅ Updated $UPDATED DRAFT record(s) with hawlCompletionDate=$YESTERDAY${NC}"
        echo -e "   You can now test T070 (Finalization workflow)"
    else
        echo -e "${YELLOW}⚠️  No DRAFT records found to update${NC}"
    fi
    
    echo ""
}

# Function to check precious metal prices cache
show_metal_prices() {
    echo -e "${YELLOW}Checking precious metal prices cache...${NC}"
    
    PRICE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM precious_metal_prices;" 2>/dev/null || echo "0")
    if [ "$PRICE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}Found $PRICE_COUNT cached price(s)${NC}"
        echo ""
        sqlite3 "$DB_PATH" "SELECT metal, pricePerGram, currency, fetchedAt, expiresAt FROM precious_metal_prices ORDER BY fetchedAt DESC LIMIT 5;" 2>/dev/null || echo "Error reading prices"
    else
        echo -e "${BLUE}No cached prices found (will fetch on first Nisab calculation)${NC}"
    fi
    
    echo ""
}

# Function to trigger Hawl detection job manually
trigger_hawl_detection() {
    echo -e "${YELLOW}Triggering Hawl detection job manually...${NC}"
    echo -e "${BLUE}Note: This requires a manual trigger endpoint or backend restart${NC}"
    echo ""
    
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  1. Restart backend server (job runs on startup)"
    echo -e "  2. Wait for hourly cron job (runs automatically)"
    echo -e "  3. Use manual trigger endpoint (if implemented)"
    echo ""
    
    read -p "Restart backend server now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restarting backend server...${NC}"
        pkill -f "node.*server"
        sleep 2
        cd "$PROJECT_ROOT"
        nohup npm run server:dev > /tmp/zakapp-backend.log 2>&1 &
        echo -e "${GREEN}✅ Backend restarted. Check logs: tail -f /tmp/zakapp-backend.log${NC}"
    else
        echo -e "${YELLOW}Skipped${NC}"
    fi
    
    echo ""
}

# Main menu
show_menu() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Testing Helper Menu${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1. Check environment (servers, database)"
    echo "2. Show test users"
    echo "3. Show Nisab Year Records"
    echo "4. Show precious metal prices cache"
    echo "5. Simulate Hawl completion (for T070 testing)"
    echo "6. Trigger Hawl detection job"
    echo "7. Open testing guide in browser"
    echo "8. View backend logs"
    echo "0. Exit"
    echo ""
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Select an option: " choice
        echo ""
        
        case $choice in
            1)
                check_servers
                check_database
                ;;
            2)
                show_test_user
                ;;
            3)
                show_nisab_records
                ;;
            4)
                show_metal_prices
                ;;
            5)
                simulate_hawl_completion
                ;;
            6)
                trigger_hawl_detection
                ;;
            7)
                if command -v xdg-open &> /dev/null; then
                    xdg-open "$PROJECT_ROOT/specs/008-nisab-year-record/MANUAL_TESTING_EXECUTION_GUIDE.md"
                    echo -e "${GREEN}✅ Opened testing guide${NC}"
                else
                    echo -e "${YELLOW}Testing guide location:${NC}"
                    echo "$PROJECT_ROOT/specs/008-nisab-year-record/MANUAL_TESTING_EXECUTION_GUIDE.md"
                fi
                echo ""
                ;;
            8)
                if [ -f /tmp/zakapp-backend.log ]; then
                    tail -50 /tmp/zakapp-backend.log
                else
                    echo -e "${YELLOW}No logs found at /tmp/zakapp-backend.log${NC}"
                fi
                echo ""
                ;;
            0)
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                echo ""
                ;;
        esac
        
        read -p "Press Enter to continue..."
        clear
    done
}

# Run initial checks
check_servers || true
check_database || true

# Start menu
main
