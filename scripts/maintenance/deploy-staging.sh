#!/bin/bash

#############################################################################
# ZakApp Staging Deployment Automation Script
# Constitutional Compliance: Privacy & Security First, Automated Quality Gates
#############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.staging"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.staging.yml"

#############################################################################
# Helper Functions
#############################################################################

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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_success "Docker found: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed."
        exit 1
    fi
    log_success "Docker Compose found: $(docker-compose --version)"
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Please create it from template: cp .env.staging.template .env.staging"
        exit 1
    fi
    log_success "Environment file found"
    
    # Check for required environment variables
    source "$ENV_FILE"
    
    if [ -z "${JWT_SECRET:-}" ] || [ "$JWT_SECRET" == "REPLACE_WITH_RANDOM_32_CHAR_SECRET_FOR_ACCESS_TOKENS" ]; then
        log_error "JWT_SECRET not configured in $ENV_FILE"
        log_info "Generate with: openssl rand -base64 32"
        exit 1
    fi
    
    if [ -z "${ENCRYPTION_KEY:-}" ] || [ "$ENCRYPTION_KEY" == "REPLACE_WITH_EXACTLY_32_CHAR_KEY" ]; then
        log_error "ENCRYPTION_KEY not configured in $ENV_FILE"
        log_info "Generate with: openssl rand -hex 16"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

generate_secrets() {
    log_info "Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '=+/')
    
    log_success "Secrets generated"
    echo ""
    echo "Add these to your .env.staging file:"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo ""
}

build_services() {
    log_info "Building Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" build \
        --build-arg NODE_ENV=staging \
        --no-cache
    
    log_success "Docker images built successfully"
}

start_services() {
    log_info "Starting services..."
    
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started"
    log_info "Waiting for services to be healthy..."
    sleep 10
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check backend health
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend health check failed after $max_attempts attempts"
            docker-compose -f "$COMPOSE_FILE" logs backend | tail -50
            exit 1
        fi
        
        sleep 2
    done
    
    # Check frontend
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend may not be fully ready yet"
    fi
    
    # Check database
    if docker-compose -f "$COMPOSE_FILE" exec -T database pg_isready -U zakapp_user > /dev/null 2>&1; then
        log_success "Database is ready"
    else
        log_error "Database is not ready"
        exit 1
    fi
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma generate
    docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma db push
    
    log_success "Database migrations completed"
}

display_status() {
    log_info "Deployment Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    
    log_info "Access URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3002"
    echo "  API Health: http://localhost:3002/health"
    echo ""
    
    log_info "Useful Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  Restart: docker-compose -f $COMPOSE_FILE restart"
}

stop_services() {
    log_info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Services stopped"
}

view_logs() {
    docker-compose -f "$COMPOSE_FILE" logs -f
}

#############################################################################
# Main Script
#############################################################################

show_usage() {
    cat << EOF
ZakApp Staging Deployment Script

Usage: $0 [COMMAND]

Commands:
    deploy          Full deployment (build, start, migrate, health checks)
    start           Start services (assumes images are built)
    stop            Stop all services
    restart         Restart all services
    logs            Follow logs from all services
    health          Run health checks
    migrate         Run database migrations
    status          Show deployment status
    secrets         Generate secure secrets (for .env.staging setup)
    help            Show this help message

Examples:
    $0 deploy       # Full deployment
    $0 logs         # Watch logs
    $0 stop         # Stop everything

EOF
}

case "${1:-help}" in
    deploy)
        log_info "🚀 Starting ZakApp staging deployment..."
        check_prerequisites
        build_services
        start_services
        run_migrations
        run_health_checks
        display_status
        log_success "✅ Deployment completed successfully!"
        ;;
    
    start)
        check_prerequisites
        start_services
        run_health_checks
        display_status
        ;;
    
    stop)
        stop_services
        ;;
    
    restart)
        stop_services
        sleep 2
        start_services
        run_health_checks
        display_status
        ;;
    
    logs)
        view_logs
        ;;
    
    health)
        run_health_checks
        ;;
    
    migrate)
        check_prerequisites
        run_migrations
        ;;
    
    status)
        display_status
        ;;
    
    secrets)
        generate_secrets
        ;;
    
    help|--help|-h)
        show_usage
        ;;
    
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
