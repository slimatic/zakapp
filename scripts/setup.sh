#!/bin/bash

# zakapp Development Environment Setup Script
# This script sets up the development environment for zakapp

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_NODE_VERSION="18.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE_VERSION" ]; then
            log_success "Node.js $NODE_VERSION is installed"
        else
            log_error "Node.js $REQUIRED_NODE_VERSION or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        log_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION is installed"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_success "Docker $DOCKER_VERSION is installed"
    else
        log_warning "Docker is not installed. Docker is optional for development but required for production deployment."
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        if command_exists docker-compose; then
            COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | sed 's/,//')
        else
            COMPOSE_VERSION=$(docker compose version --short)
        fi
        log_success "Docker Compose $COMPOSE_VERSION is installed"
    else
        log_warning "Docker Compose is not installed. Required for containerized development."
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log_success "Git $GIT_VERSION is installed"
    else
        log_error "Git is not installed"
        exit 1
    fi
}

# Create environment files
create_env_files() {
    log_info "Creating environment files..."
    
    # Root .env file
    if [ ! -f .env ]; then
        cat > .env << EOF
# zakapp Development Environment Configuration

# Node.js Environment
NODE_ENV=development

# API Configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Security (Change these in production!)
JWT_SECRET=dev-jwt-secret-change-in-production
ENCRYPTION_KEY=dev-encryption-key-change-in-production

# Data Storage
DATA_DIR=./backend/data

# Development Settings
HOT_RELOAD=true
DEBUG_MODE=true
EOF
        log_success "Created .env file"
    else
        log_info ".env file already exists"
    fi
    
    # Backend .env file
    if [ ! -f backend/.env ]; then
        mkdir -p backend
        cat > backend/.env << EOF
# zakapp Backend Environment Configuration

NODE_ENV=development
PORT=3001

# Security
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=dev-encryption-key-change-in-production

# Data Storage
DATA_DIR=./data
BACKUP_DIR=./data/backups

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Development
HOT_RELOAD=true
EOF
        log_success "Created backend/.env file"
    else
        log_info "backend/.env file already exists"
    fi
    
    # Frontend .env file
    if [ ! -f frontend/.env ]; then
        mkdir -p frontend
        cat > frontend/.env << EOF
# zakapp Frontend Environment Configuration

# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_TIMEOUT=10000

# Application Settings
REACT_APP_NAME=zakapp
REACT_APP_VERSION=1.0.0

# Features
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=false

# Development
REACT_APP_DEBUG=true
GENERATE_SOURCEMAP=true
EOF
        log_success "Created frontend/.env file"
    else
        log_info "frontend/.env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install root dependencies
    log_info "Installing root dependencies..."
    npm install
    
    # Install shared dependencies
    if [ -d shared ]; then
        log_info "Installing shared dependencies..."
        cd shared && npm install && cd ..
    fi
    
    # Install backend dependencies
    if [ -d backend ]; then
        log_info "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Install frontend dependencies
    if [ -d frontend ]; then
        log_info "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    log_success "All dependencies installed"
}

# Create initial project structure
create_project_structure() {
    log_info "Creating project structure..."
    
    # Create necessary directories
    mkdir -p {frontend,backend,shared}/{src,dist}
    mkdir -p backend/data/{users,backups}
    mkdir -p backend/logs
    mkdir -p frontend/public
    mkdir -p tests/{unit,integration,e2e}
    mkdir -p docker
    mkdir -p scripts
    mkdir -p .github/workflows
    
    # Create .gitkeep files for empty directories
    touch backend/data/users/.gitkeep
    touch backend/data/backups/.gitkeep
    touch backend/logs/.gitkeep
    touch tests/unit/.gitkeep
    touch tests/integration/.gitkeep
    touch tests/e2e/.gitkeep
    
    log_success "Project structure created"
}

# Set up git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    if [ -d .git ]; then
        # Install husky for Git hooks
        if command_exists npx; then
            npx husky install
            
            # Add pre-commit hook
            npx husky add .husky/pre-commit "npm run lint-staged"
            
            # Add commit-msg hook for conventional commits
            npx husky add .husky/commit-msg "npx commitizen --hook || true"
            
            log_success "Git hooks configured"
        else
            log_warning "npx not available, skipping Git hooks setup"
        fi
    else
        log_warning "Not a Git repository, skipping Git hooks setup"
    fi
}

# Generate development certificates
generate_dev_certificates() {
    log_info "Generating development SSL certificates..."
    
    if command_exists openssl; then
        mkdir -p ssl
        
        if [ ! -f ssl/key.pem ] || [ ! -f ssl/cert.pem ]; then
            openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            chmod 600 ssl/key.pem
            chmod 644 ssl/cert.pem
            log_success "Development SSL certificates generated"
        else
            log_info "SSL certificates already exist"
        fi
    else
        log_warning "OpenSSL not available, skipping SSL certificate generation"
    fi
}

# Create development scripts
create_scripts() {
    log_info "Creating development scripts..."
    
    mkdir -p scripts
    
    # Development start script
    cat > scripts/dev.sh << 'EOF'
#!/bin/bash
# Start development environment

echo "Starting zakapp development environment..."

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev &
FRONTEND_PID=$!

# Handle cleanup on exit
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
EOF
    
    # Build script
    cat > scripts/build.sh << 'EOF'
#!/bin/bash
# Build the application for production

echo "Building zakapp for production..."

# Build shared components
cd shared && npm run build && cd ..

# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..

echo "Build completed successfully!"
EOF
    
    # Test script
    cat > scripts/test.sh << 'EOF'
#!/bin/bash
# Run all tests

echo "Running zakapp tests..."

# Run shared tests
cd shared && npm test && cd ..

# Run backend tests
cd backend && npm test && cd ..

# Run frontend tests
cd frontend && npm test && cd ..

echo "All tests completed!"
EOF
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    log_success "Development scripts created"
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    # Check if all package.json files exist
    local missing_files=()
    
    [ ! -f package.json ] && missing_files+=("package.json")
    [ ! -f shared/package.json ] && missing_files+=("shared/package.json")
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Missing package.json files: ${missing_files[*]}"
        return 1
    fi
    
    # Check if node_modules exist
    local missing_modules=()
    
    [ ! -d node_modules ] && missing_modules+=("root node_modules")
    [ ! -d shared/node_modules ] && missing_modules+=("shared/node_modules")
    
    if [ ${#missing_modules[@]} -gt 0 ]; then
        log_warning "Missing node_modules: ${missing_modules[*]}"
    fi
    
    log_success "Setup validation completed"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                            zakapp Development Setup                          ║"
    echo "║              Self-hosted Zakat Application Development Environment          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Starting zakapp development environment setup..."
    
    # Run setup steps
    check_prerequisites
    create_project_structure
    create_env_files
    install_dependencies
    setup_git_hooks
    generate_dev_certificates
    create_scripts
    validate_setup
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                              Setup Completed!                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_success "zakapp development environment is ready!"
    echo ""
    log_info "Next steps:"
    echo "  1. Review and update environment files (.env, backend/.env, frontend/.env)"
    echo "  2. Start development: npm run dev"
    echo "  3. Access frontend at: http://localhost:3000"
    echo "  4. Access backend at: http://localhost:3001"
    echo ""
    log_info "Available commands:"
    echo "  npm run dev          - Start development environment"
    echo "  npm run build        - Build for production"
    echo "  npm run test         - Run all tests"
    echo "  npm run lint         - Run linting"
    echo "  npm run docker:dev   - Start with Docker"
    echo ""
    log_info "For more information, see the documentation in the docs/ directory."
}

# Check if script is being run directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi