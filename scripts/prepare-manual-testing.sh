#!/bin/bash

# Script to prepare environment for T133 and T150 manual testing
# Feature 004: Enhanced Zakat Calculation Engine

set -e

echo "======================================"
echo "Feature 004 Manual Testing Setup"
echo "Tasks: T133 & T150"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

print_status "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Check Node.js and npm
print_status "Step 1: Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION found"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm $NPM_VERSION found"
echo ""

# Step 2: Check if dependencies are installed
print_status "Step 2: Checking dependencies..."

if [ ! -d "server/node_modules" ]; then
    print_warning "Server dependencies not installed. Installing..."
    cd server
    npm install
    cd ..
    print_success "Server dependencies installed"
else
    print_success "Server dependencies already installed"
fi

if [ ! -d "client/node_modules" ]; then
    print_warning "Client dependencies not installed. Installing..."
    cd client
    npm install
    cd ..
    print_success "Client dependencies installed"
else
    print_success "Client dependencies already installed"
fi
echo ""

# Step 3: Check database setup
print_status "Step 3: Checking database setup..."

if [ ! -f "server/prisma/dev.db" ]; then
    print_warning "Database not found. Setting up database..."
    cd server
    npx prisma migrate deploy
    cd ..
    print_success "Database migrations applied"
else
    print_success "Database exists"
    
    # Check if migrations are up to date
    cd server
    MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)
    if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
        print_success "Database migrations up to date"
    else
        print_warning "Database migrations may need to be applied"
        print_status "Run: cd server && npx prisma migrate deploy"
    fi
    cd ..
fi
echo ""

# Step 4: Check for test user
print_status "Step 4: Test user setup..."
print_warning "Ensure test user exists:"
print_status "  Email: test@zakapp.local"
print_status "  Password: TestPass123!"
print_status "If not, create via registration or seed script"
echo ""

# Step 5: Check port availability
print_status "Step 5: Checking port availability..."

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 1
    else
        return 0
    fi
}

if check_port 5001; then
    print_success "Port 5001 (backend) is available"
else
    print_warning "Port 5001 (backend) is in use"
    print_status "Kill existing process: lsof -ti:5001 | xargs kill -9"
fi

if check_port 3000; then
    print_success "Port 3000 (frontend) is available"
else
    print_warning "Port 3000 (frontend) is in use"
    print_status "Kill existing process: lsof -ti:3000 | xargs kill -9"
fi
echo ""

# Step 6: Environment variables check
print_status "Step 6: Checking environment variables..."

if [ -f "server/.env" ]; then
    print_success "Server .env file exists"
else
    print_warning "Server .env file not found"
    if [ -f "server/.env.example" ]; then
        print_status "Copying .env.example to .env..."
        cp server/.env.example server/.env
        print_success "Created server/.env from .env.example"
        print_warning "Please review and update server/.env with appropriate values"
    else
        print_error "No .env.example file found in server directory"
    fi
fi

if [ -f "client/.env" ]; then
    print_success "Client .env file exists"
elif [ -f "client/.env.local" ]; then
    print_success "Client .env.local file exists"
else
    print_warning "Client .env file not found (may not be required)"
fi
echo ""

# Step 7: Create test data directory
print_status "Step 7: Setting up test data directory..."
mkdir -p "$PROJECT_ROOT/test-data"
print_success "Test data directory ready: $PROJECT_ROOT/test-data"
echo ""

# Step 8: Verify testing guide exists
print_status "Step 8: Verifying testing documentation..."

if [ -f "docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md" ]; then
    print_success "Manual testing guide found"
    print_status "Location: docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md"
else
    print_error "Manual testing guide not found!"
fi

if [ -f "docs/manual-testing/QUICK_REFERENCE_CARD.md" ]; then
    print_success "Quick reference card found"
    print_status "Location: docs/manual-testing/QUICK_REFERENCE_CARD.md"
else
    print_warning "Quick reference card not found"
fi
echo ""

# Step 9: Create helper scripts
print_status "Step 9: Creating helper scripts..."

# Create start-backend.sh
cat > "$PROJECT_ROOT/start-backend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/server"
echo "Starting backend server on http://localhost:5001..."
npm run dev
EOF
chmod +x "$PROJECT_ROOT/start-backend.sh"
print_success "Created start-backend.sh"

# Create start-frontend.sh
cat > "$PROJECT_ROOT/start-frontend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/client"
echo "Starting frontend on http://localhost:3000..."
npm run dev
EOF
chmod +x "$PROJECT_ROOT/start-frontend.sh"
print_success "Created start-frontend.sh"

# Create check-services.sh
cat > "$PROJECT_ROOT/check-services.sh" << 'EOF'
#!/bin/bash
echo "Checking services..."
echo ""

# Check backend
echo -n "Backend (http://localhost:5001): "
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check frontend
echo -n "Frontend (http://localhost:3000): "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi
EOF
chmod +x "$PROJECT_ROOT/check-services.sh"
print_success "Created check-services.sh"
echo ""

# Summary
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
print_success "Environment is ready for manual testing"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start Backend:"
echo "   ${BLUE}./start-backend.sh${NC}"
echo "   or"
echo "   ${BLUE}cd server && npm run dev${NC}"
echo ""
echo "2. Start Frontend (in new terminal):"
echo "   ${BLUE}./start-frontend.sh${NC}"
echo "   or"
echo "   ${BLUE}cd client && npm run dev${NC}"
echo ""
echo "3. Check Services:"
echo "   ${BLUE}./check-services.sh${NC}"
echo ""
echo "4. Open Testing Guide:"
echo "   ${BLUE}docs/manual-testing/FEATURE_004_MANUAL_TESTING_GUIDE.md${NC}"
echo ""
echo "5. Open Quick Reference:"
echo "   ${BLUE}docs/manual-testing/QUICK_REFERENCE_CARD.md${NC}"
echo ""
echo "6. Access Application:"
echo "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo "   Backend API: ${GREEN}http://localhost:5001${NC}"
echo ""
echo "7. Test User Credentials:"
echo "   Email: ${GREEN}test@zakapp.local${NC}"
echo "   Password: ${GREEN}TestPass123!${NC}"
echo ""
echo "======================================"
echo "Happy Testing! 🚀"
echo "======================================"
