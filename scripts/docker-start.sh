#!/bin/bash
# ZakApp Docker Bootstrap Script
# Usage: ./docker-start.sh [--rebuild] [--reset-db]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 ZakApp Docker Bootstrap${NC}"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Parse arguments
REBUILD=false
RESET_DB=false
for arg in "$@"; do
    case $arg in
        --rebuild)
            REBUILD=true
            ;;
        --reset-db)
            RESET_DB=true
            ;;
    esac
done

# Generate secure secrets if .env.docker doesn't exist
generate_secrets() {
    echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
    
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    
    cat > .env.docker << EOF
# ZakApp Docker Environment Configuration
# Generated: $(date -Iseconds)
# =========================================
# SECURITY WARNING: Do NOT commit this file to version control

# JWT Authentication Secret
JWT_SECRET=${JWT_SECRET}

# JWT Refresh Token Secret
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# Data Encryption Key (AES-256)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Optional: Metals API Key for live gold/silver prices
# METALS_API_KEY=your_api_key_here
EOF

    chmod 600 .env.docker
    echo -e "${GREEN}✅ Secrets generated and saved to .env.docker${NC}"
}

# Check/create .env.docker
if [ ! -f .env.docker ]; then
    echo -e "${YELLOW}⚠️  No .env.docker found${NC}"
    generate_secrets
elif grep -q "REPLACE_WITH_SECURE_SECRET" .env.docker 2>/dev/null; then
    echo -e "${YELLOW}⚠️  .env.docker contains placeholder secrets${NC}"
    generate_secrets
else
    echo -e "${GREEN}✅ Using existing .env.docker${NC}"
fi

# Reset database if requested
if $RESET_DB; then
    echo -e "${YELLOW}🗑️  Resetting database...${NC}"
    docker volume rm zakapp-database 2>/dev/null || true
fi

# Stop any existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true

if $REBUILD; then
    echo -e "${YELLOW}🔨 Rebuilding images (this may take a few minutes)...${NC}"
    docker compose build --no-cache
else
    echo -e "${YELLOW}🔨 Building images (using cache)...${NC}"
    docker compose build
fi

# Start services
echo -e "${YELLOW}▶️  Starting services...${NC}"
docker compose up -d

# Wait for backend to be healthy
echo -e "${YELLOW}⏳ Waiting for backend to initialize...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose logs backend 2>&1 | grep -q "ZakApp Server running"; then
        break
    fi
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
done
echo ""

# Final status check
sleep 3
BACKEND_HEALTHY=$(docker compose ps backend --format json 2>/dev/null | grep -c "running" || echo "0")
FRONTEND_HEALTHY=$(docker compose ps frontend --format json 2>/dev/null | grep -c "running" || echo "0")

echo ""
echo "================================"
echo -e "${GREEN}✅ ZakApp Started!${NC}"
echo ""

if [ "$BACKEND_HEALTHY" != "0" ]; then
    echo -e "${GREEN}✅ Backend:  http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend:  Failed to start${NC}"
    echo "   Run 'docker compose logs backend' for details"
fi

if [ "$FRONTEND_HEALTHY" != "0" ]; then
    echo -e "${GREEN}✅ Frontend: http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⏳ Frontend: http://localhost:3000 (starting...)${NC}"
fi

echo ""
echo "Commands:"
echo "  View logs:     docker compose logs -f"
echo "  Backend logs:  docker compose logs -f backend"
echo "  Stop:          docker compose down"
echo "  Rebuild:       ./docker-start.sh --rebuild"
echo "  Reset DB:      ./docker-start.sh --reset-db"
echo ""
echo -e "${GREEN}Open http://localhost:3000 in your browser${NC}"
