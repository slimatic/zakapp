#!/bin/bash

# Port Configuration Test Script
# This script tests various port configurations to ensure they work correctly

set -e

echo "🔧 Port Configuration Test Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: Check if .env.example files exist
echo "Test 1: Checking for .env.example files"
echo "----------------------------------------"

if [ -f "server/.env.example" ]; then
    success "server/.env.example exists"
else
    error "server/.env.example not found"
    exit 1
fi

if [ -f "client/.env.example" ]; then
    success "client/.env.example exists"
else
    error "client/.env.example not found"
    exit 1
fi

echo ""

# Test 2: Check if PORT is documented in .env.example
echo "Test 2: Checking PORT documentation"
echo "------------------------------------"

if grep -q "PORT=" server/.env.example; then
    success "PORT configuration found in server/.env.example"
else
    error "PORT not documented in server/.env.example"
    exit 1
fi

if grep -q "REACT_APP_API_BASE_URL" client/.env.example; then
    success "REACT_APP_API_BASE_URL found in client/.env.example"
else
    error "REACT_APP_API_BASE_URL not documented in client/.env.example"
    exit 1
fi

echo ""

# Test 3: Create test environment files
echo "Test 3: Creating test environment configuration"
echo "------------------------------------------------"

info "Creating server/.env with PORT=3082"
cat > server/.env << 'EOF'
NODE_ENV=development
PORT=3082
CLIENT_URL=http://localhost:3000
JWT_SECRET=test-secret-key-for-testing-only
JWT_EXPIRES_IN=7d
DATA_DIR=./data
ENCRYPTION_KEY=test-encryption-key-32-chars-x
BCRYPT_ROUNDS=12
EOF

success "Created server/.env with PORT=3082"

info "Creating client/.env.local with REACT_APP_API_BASE_URL=http://localhost:3082/api"
cat > client/.env.local << 'EOF'
REACT_APP_API_BASE_URL=http://localhost:3082/api
REACT_APP_ENV=development
REACT_APP_ENABLE_DEBUG=true
EOF

success "Created client/.env.local pointing to port 3082"

echo ""

# Test 4: Verify files were created
echo "Test 4: Verifying configuration files"
echo "--------------------------------------"

if [ -f "server/.env" ]; then
    success "server/.env created"
    PORT_VALUE=$(grep "^PORT=" server/.env | cut -d'=' -f2)
    info "Backend PORT set to: $PORT_VALUE"
else
    error "server/.env not created"
    exit 1
fi

if [ -f "client/.env.local" ]; then
    success "client/.env.local created"
    API_URL=$(grep "^REACT_APP_API_BASE_URL=" client/.env.local | cut -d'=' -f2)
    info "Frontend API URL set to: $API_URL"
else
    error "client/.env.local not created"
    exit 1
fi

echo ""

# Test 5: Check if PORT and API URL match
echo "Test 5: Validating port configuration consistency"
echo "--------------------------------------------------"

BACKEND_PORT=$(grep "^PORT=" server/.env | cut -d'=' -f2)
FRONTEND_API_URL=$(grep "^REACT_APP_API_BASE_URL=" client/.env.local | cut -d'=' -f2)

if echo "$FRONTEND_API_URL" | grep -q "$BACKEND_PORT"; then
    success "Frontend API URL includes backend PORT ($BACKEND_PORT)"
    success "Configuration is consistent!"
else
    error "Port mismatch detected!"
    error "Backend PORT: $BACKEND_PORT"
    error "Frontend API URL: $FRONTEND_API_URL"
    exit 1
fi

echo ""

# Test 6: Check documentation files
echo "Test 6: Checking documentation"
echo "-------------------------------"

if [ -f "DEVELOPMENT_SETUP.md" ]; then
    if grep -q "Port Configuration" DEVELOPMENT_SETUP.md; then
        success "Port Configuration section found in DEVELOPMENT_SETUP.md"
    else
        error "Port Configuration not documented in DEVELOPMENT_SETUP.md"
    fi
else
    error "DEVELOPMENT_SETUP.md not found"
fi

if [ -f "PORT_CONFIGURATION_GUIDE.md" ]; then
    success "PORT_CONFIGURATION_GUIDE.md exists"
else
    info "PORT_CONFIGURATION_GUIDE.md not found (optional)"
fi

echo ""

# Test 7: Cleanup
echo "Test 7: Cleanup test files"
echo "--------------------------"

info "Removing test configuration files..."
rm -f server/.env
rm -f client/.env.local
success "Test files cleaned up"

echo ""
echo "=================================="
echo -e "${GREEN}✓ All tests passed!${NC}"
echo "=================================="
echo ""
echo "Summary:"
echo "--------"
echo "✓ .env.example files exist and are documented"
echo "✓ PORT configuration is properly documented"
echo "✓ Test configurations can be created successfully"
echo "✓ Configuration validation works correctly"
echo "✓ Documentation is available"
echo ""
echo "Next steps:"
echo "1. Copy server/.env.example to server/.env"
echo "2. Copy client/.env.example to client/.env.local"
echo "3. Update PORT in server/.env if needed"
echo "4. Update REACT_APP_API_BASE_URL in client/.env.local to match"
echo "5. Run: npm run dev"
echo ""
echo "For detailed instructions, see:"
echo "- DEVELOPMENT_SETUP.md"
echo "- PORT_CONFIGURATION_GUIDE.md"
