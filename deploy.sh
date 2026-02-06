#!/bin/bash
# ZakApp Simple Docker Deployment Script
# This script sets up ZakApp for users with minimal Docker knowledge

set -e

echo "🚀 ZakApp Docker Deployment Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
check_docker() {
    echo "📦 Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: sudo apt-get install docker.io"
        echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
        echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        echo "Please install Docker Compose plugin"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
}

# Generate secrets
generate_secrets() {
    echo ""
    echo "🔐 Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    REFRESH_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    APP_SECRET=$(openssl rand -base64 32)
    COUCHDB_PASSWORD=$(openssl rand -base64 16)
    COUCHDB_JWT_SECRET=$(openssl rand -base64 32)
    
    echo -e "${GREEN}✅ Secrets generated${NC}"
}

# Create .env file
create_env_file() {
    echo ""
    echo "📝 Creating configuration file..."
    
    if [ -f .env ]; then
        echo -e "${YELLOW}⚠️  .env file already exists${NC}"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Keeping existing .env file"
            return
        fi
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "Backup created: .env.backup.*"
    fi
    
    cat > .env << EOF
# =====================================================
# ZAKAPP CONFIGURATION - AUTO-GENERATED
# =====================================================
# Generated: $(date)
# This file contains sensitive data - keep it secure!
# =====================================================

# Security Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
REFRESH_SECRET=$REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
APP_SECRET=$APP_SECRET

# CouchDB Configuration
COUCHDB_USER=admin
COUCHDB_PASSWORD=$COUCHDB_PASSWORD
COUCHDB_JWT_SECRET=$COUCHDB_JWT_SECRET

# URLs
APP_URL=http://localhost:3000
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_COUCHDB_URL=http://localhost:5984

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
COUCHDB_PORT=5984

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
ALLOWED_HOSTS=localhost

# Admin Access
ADMIN_EMAILS=admin@example.com

# Email (optional - uncomment to configure)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@yourdomain.com
# SMTP_FROM_NAME=ZakApp

# Gold/Silver API (optional - get free key from goldapi.io)
# GOLD_API_KEY=
EOF
    
    chmod 600 .env
    echo -e "${GREEN}✅ Configuration file created: .env${NC}"
}

# Deploy the application
deploy() {
    echo ""
    echo "🚀 Deploying ZakApp..."
    echo "This may take a few minutes the first time..."
    echo ""
    
    docker compose -f docker-compose.local.yml down 2>/dev/null || true
    docker compose -f docker-compose.local.yml up -d --build
    
    echo ""
    echo -e "${GREEN}✅ ZakApp is starting up!${NC}"
    echo ""
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for health checks
    for i in {1..30}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    echo ""
    echo ""
    echo "===================================="
    echo -e "${GREEN}🎉 ZakApp is running!${NC}"
    echo "===================================="
    echo ""
    echo "📱 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo "   CouchDB:  http://localhost:5984"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     docker compose -f docker-compose.local.yml logs -f"
    echo "   Stop:          docker compose -f docker-compose.local.yml down"
    echo "   Restart:       docker compose -f docker-compose.local.yml restart"
    echo ""
    echo "🔐 Admin access:"
    echo "   Email: admin@example.com (change in .env file)"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "   - Keep your .env file secure (it contains secrets)"
    echo "   - Backup your data regularly"
    echo "   - For production, use HTTPS and a reverse proxy"
    echo ""
}

# Show status
show_status() {
    echo ""
    echo "📊 Current Status:"
    docker compose -f docker-compose.local.yml ps 2>/dev/null || echo "Not running"
}

# Main menu
main() {
    check_docker
    
    echo ""
    echo "What would you like to do?"
    echo ""
    echo "1) Deploy ZakApp (first time setup)"
    echo "2) Start existing deployment"
    echo "3) Stop deployment"
    echo "4) View status"
    echo "5) View logs"
    echo "6) Update to latest version"
    echo ""
    
    if [ -z "$1" ]; then
        read -p "Enter choice [1-6]: " choice
    else
        choice=$1
    fi
    
    case $choice in
        1)
            generate_secrets
            create_env_file
            deploy
            ;;
        2)
            docker compose -f docker-compose.local.yml up -d
            echo -e "${GREEN}✅ ZakApp started${NC}"
            ;;
        3)
            docker compose -f docker-compose.local.yml down
            echo -e "${GREEN}✅ ZakApp stopped${NC}"
            ;;
        4)
            show_status
            ;;
        5)
            docker compose -f docker-compose.local.yml logs -f
            ;;
        6)
            echo "🔄 Updating to latest version..."
            docker compose -f docker-compose.local.yml down
            docker compose -f docker-compose.local.yml pull
            docker compose -f docker-compose.local.yml up -d --build
            echo -e "${GREEN}✅ Update complete${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"