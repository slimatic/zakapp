#!/bin/bash

# zakapp npm containerized setup script
# This script provides containerized npm installation to avoid host OS permission issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        log_success "Docker $DOCKER_VERSION is installed"
    else
        log_error "Docker is not installed. Please install Docker and try again."
        exit 1
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
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Setup using containerized npm
setup_containerized() {
    log_info "Setting up zakapp with containerized npm..."
    
    # Build the npm container
    log_info "Building containerized npm environment..."
    docker compose --profile npm-tools build npm-env
    
    # Start the npm container
    log_info "Starting npm container..."
    docker compose --profile npm-tools up -d npm-env
    
    # Install all dependencies in container
    log_info "Installing dependencies in container (this may take a few minutes)..."
    docker compose --profile npm-tools exec npm-env npm run install:all
    
    log_success "Containerized setup complete!"
}

# Setup using local npm (fallback)
setup_local() {
    log_info "Setting up zakapp with local npm..."
    log_warning "This may require sudo permissions if you encounter EACCES errors"
    
    # Check if Node.js is available
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
    
    # Try npm install
    log_info "Installing dependencies..."
    if npm run install:all; then
        log_success "Local setup complete!"
    else
        log_error "npm install failed. Try using containerized setup: ./scripts/setup-npm.sh --docker"
        exit 1
    fi
}

# Start development environment
start_dev() {
    log_info "Starting development environment..."
    
    if [ "$1" = "--docker" ]; then
        log_info "Using Docker development environment..."
        docker compose -f docker-compose.dev.yml up --build
    else
        log_info "Starting local development servers..."
        npm run dev
    fi
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "🚀 zakapp Setup Script"
    echo "======================"
    echo -e "${NC}"
    
    check_prerequisites
    
    case "${1:-}" in
        --docker|--containerized)
            setup_containerized
            log_info "To start development: npm run docker:dev"
            ;;
        --local|--host)
            setup_local
            log_info "To start development: npm run dev"
            ;;
        --start)
            start_dev "${2:-}"
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --docker, --containerized    Use containerized npm (recommended)"
            echo "  --local, --host             Use local npm installation"
            echo "  --start [--docker]          Start development environment"
            echo "  --help, -h                  Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --docker                 Setup with containerized npm"
            echo "  $0 --local                  Setup with local npm"
            echo "  $0 --start --docker         Start Docker development environment"
            echo "  $0 --start                  Start local development environment"
            ;;
        *)
            log_info "No option specified. Trying containerized setup first..."
            if setup_containerized; then
                log_info "To start development: npm run docker:dev"
            else
                log_warning "Containerized setup failed. Falling back to local setup..."
                setup_local
                log_info "To start development: npm run dev"
            fi
            ;;
    esac
    
    echo ""
    log_success "Setup complete! 🎉"
    echo ""
    log_info "Available commands:"
    echo "  npm run docker:dev          - Start containerized development"
    echo "  npm run dev                 - Start local development"
    echo "  npm run docker:npm:install  - Reinstall dependencies in container"
    echo "  npm run docker:dev:logs     - View container logs"
    echo "  npm run docker:dev:down     - Stop development containers"
}

# Check if script is being run directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi