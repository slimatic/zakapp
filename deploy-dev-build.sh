#!/bin/bash
# ZakApp Development Build Deployment Script
# Builds from local source with hot-reload support
# Use this for local development with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"
COMPOSE_PROFILE="--profile dev --env-file .env.dev"

# Dev-specific defaults (different from production to avoid conflicts)
DEFAULT_HTTP_PORT=3002
DEFAULT_HTTPS_PORT=3444

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if Docker is installed
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: sudo apt-get install docker.io"
        echo "  macOS/Windows: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo "Please install Docker Compose plugin"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker daemon is not running"
        echo "Please start Docker and try again:"
        echo "  Ubuntu: sudo systemctl start docker"
        echo "  macOS: Start Docker Desktop from Applications"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Detect the server's IP address
detect_ip() {
    local ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    if [ -z "$ip" ]; then
        ip=$(ip route get 1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    if [ -z "$ip" ]; then
        ip=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)
    fi
    
    echo "$ip"
}

# Verify network accessibility
verify_network() {
    local ip=$1
    print_status "Checking network configuration..."
    
    if [ -z "$ip" ]; then
        print_warning "Could not detect server IP automatically"
        return 1
    fi
    
    if [[ "$ip" == 127.* ]]; then
        print_warning "Detected IP is localhost ($ip)"
        print_status "Network access will only work if you configure a real IP"
        return 1
    fi
    
    print_success "Network IP detected: $ip"
    return 0
}

# Check if a port is in use
check_port() {
    local port=$1
    if docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps 2>/dev/null | grep -q "$port"; then
        return 0
    fi
    
    if command -v netstat &> /dev/null; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
        return $?
    elif command -v ss &> /dev/null; then
        ss -tuln 2>/dev/null | grep -q ":$port "
        return $?
    fi
    
    return 1
}

# Find next available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while check_port "$port"; do
        port=$((port + 1))
        if [ $port -gt 65535 ]; then
            print_error "No available ports found"
            exit 1
        fi
    done
    
    echo "$port"
}

# Generate a secure secret
generate_secret() {
    openssl rand -base64 32
}

# Validate email addresses (comma-separated)
validate_emails() {
    local emails=$1
    local email_regex="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    
    IFS=',' read -ra EMAIL_ARRAY <<< "$emails"
    for email in "${EMAIL_ARRAY[@]}"; do
        email=$(echo "$email" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        
        if [ -z "$email" ]; then
            continue
        fi
        
        if [[ ! $email =~ $email_regex ]]; then
            return 1
        fi
    done
    return 0
}

# Collect admin email addresses from user
collect_admin_emails() {
    print_status "Configuring admin access"
    echo ""
    echo "Admin email addresses will have access to the ZakApp dashboard."
    echo "You can enter multiple emails separated by commas."
    echo "Example: admin@example.com, manager@company.com"
    echo ""
    
    local admin_emails=""
    while true; do
        read -p "Enter admin email addresses (comma-separated): " admin_emails
        
        if [ -z "$admin_emails" ]; then
            print_warning "No admin emails specified. You can add them later by editing the .env.dev file."
            return
        fi
        
        if validate_emails "$admin_emails"; then
            break
        else
            print_error "Invalid email format. Please enter valid email addresses."
            echo "Examples: admin@example.com or admin@example.com,manager@company.com"
        fi
    done
    
    if grep -q "^ADMIN_EMAILS=" "$ENV_FILE"; then
        sed -i "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=$admin_emails|" "$ENV_FILE"
    else
        echo "ADMIN_EMAILS=$admin_emails" >> "$ENV_FILE"
    fi
    
    print_success "Admin emails configured: $admin_emails"
}

# Setup environment file with dev-specific defaults
setup_environment() {
    print_header "Setting up Environment (Development Mode)"
    
    # Check if env file exists
    if [ -f "$ENV_FILE" ]; then
        print_warning "$ENV_FILE file already exists"
        echo ""
        echo "Options:"
        echo "  1) Keep existing configuration"
        echo "  2) Regenerate with dev defaults (will backup existing)"
        echo "  3) Update access settings only"
        read -p "Select option (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                print_status "Using existing $ENV_FILE configuration"
                local server_ip=$(detect_ip)
                verify_network "$server_ip" || true
                return
                ;;
            2)
                cp "$ENV_FILE" ".env.backup.dev.$(date +%Y%m%d_%H%M%S)"
                print_status "Backup created: .env.backup.dev.*"
                rm -f "$ENV_FILE"
                ;;
            3)
                print_status "Updating access settings only..."
                configure_access_mode
                configure_ports
                generate_missing_secrets
                print_success "Environment configured"
                return
                ;;
            *)
                print_warning "Invalid option, keeping existing configuration"
                return
                ;;
        esac
    fi
    
    # Set dev-specific defaults
    echo "# ZakApp Development Environment" >> "$ENV_FILE"
    echo "# Generated by deploy-dev-build.sh" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
    
    # Port configuration with dev defaults
    echo "FRONTEND_PORT=$DEFAULT_HTTP_PORT" >> "$ENV_FILE"
    echo "FRONTEND_PORT_SSL=$DEFAULT_HTTPS_PORT" >> "$ENV_FILE"
    echo "CLIENT_URL=http://localhost:$DEFAULT_HTTP_PORT" >> "$ENV_FILE"
    echo "ALLOWED_ORIGINS=http://localhost:$DEFAULT_HTTP_PORT" >> "$ENV_FILE"
    echo "ALLOWED_HOSTS=localhost" >> "$ENV_FILE"
    echo "APP_URL=http://localhost:$DEFAULT_HTTP_PORT" >> "$ENV_FILE"
    
    # Configure access mode
    configure_access_mode
    generate_missing_secrets
    
    # Detect actual ports and update CORS settings
    configure_ports
    
    print_success "Environment configured with dev defaults (ports $DEFAULT_HTTP_PORT/$DEFAULT_HTTPS_PORT)"
}

# Configure access mode (IP/domain/localhost)
configure_access_mode() {
    local server_ip=$(detect_ip)
    verify_network "$server_ip" || true
    
    print_status "Detected server IP: $server_ip"
    echo ""
    echo "How will you access ZakApp dev?"
    echo "1) Localhost only (this machine)"
    echo "2) IP address ($server_ip) - accessible from your network"
    echo "3) Custom domain"
    read -p "Select option (1-3) [default: 2]: " access_option
    
    # Default to IP access if no input
    if [ -z "$access_option" ]; then
        access_option="2"
    fi
    
    local access_mode=""
    case $access_option in
        1)
            access_mode="localhost"
            ;;
        2)
            access_mode="ip"
            ;;
        3)
            access_mode="domain"
            ;;
        *)
            print_warning "Invalid option, defaulting to IP access (most common for dev)"
            access_mode="ip"
            ;;
    esac
    
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTP_PORT")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTPS_PORT")
    
    case $access_mode in
        localhost)
            sed -i "s|^APP_URL=.*|APP_URL=http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^CLIENT_URL=.*|CLIENT_URL=http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=localhost|" "$ENV_FILE"
            print_success "Configured for localhost access (http://localhost:$http_port)"
            ;;
        ip)
            sed -i "s|^APP_URL=.*|APP_URL=https://$server_ip:$https_port|" "$ENV_FILE"
            sed -i "s|^CLIENT_URL=.*|CLIENT_URL=https://$server_ip:$https_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$server_ip:$https_port,http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$server_ip,localhost|" "$ENV_FILE"
            print_success "Configured for IP access: https://$server_ip:$https_port"
            ;;
        domain)
            read -p "Enter your domain (e.g., zakapp-dev.example.com): " domain
            sed -i "s|^APP_URL=.*|APP_URL=https://$domain|" "$ENV_FILE"
            sed -i "s|^CLIENT_URL=.*|CLIENT_URL=https://$domain|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$domain|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$domain|" "$ENV_FILE"
            sed -i "s|^# ZAKAPP_DOMAIN=.*|ZAKAPP_DOMAIN=$domain|" "$ENV_FILE"
            print_success "Configured for domain: https://$domain"
            ;;
    esac
    
    collect_admin_emails
}

# Configure ports - detect actual ports after container start
configure_ports() {
    local server_ip=$(detect_ip)
    
    # Check if services are already running
    local running=$(docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps -q 2>/dev/null | wc -l)
    
    if [ "$running" -eq 0 ]; then
        # No services running, start them temporarily to detect ports
        print_status "Starting services temporarily to detect actual port assignments..."
        docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE up -d --no-build 2>/dev/null || true
        sleep 8
    fi
    
    # Get actual HTTP port from docker compose ps
    local http_port=$(docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps --format json 2>/dev/null | grep -o '"HostPort":"[0-9]*"' | head -1 | grep -o '[0-9]*$' || echo "")
    
    # If not found via JSON, try alternative method
    if [ -z "$http_port" ]; then
        http_port=$(docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps caddy 2>/dev/null | grep -oE '0\.0\.0\.0:[0-9]+->80' | grep -oE '[0-9]+(?=->80)' || echo "")
    fi
    
    # Get actual HTTPS port
    local https_port=$(docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps caddy 2>/dev/null | grep -oE '0\.0\.0\.0:[0-9]+->443' | grep -oE '[0-9]+(?=->443)' || echo "")
    
    # Fallback to default if detection failed
    if [ -z "$http_port" ]; then
        http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTP_PORT")
    fi
    if [ -z "$https_port" ]; then
        https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTPS_PORT")
    fi
    
    print_status "Detected actual ports - HTTP: $http_port, HTTPS: $https_port"
    
    # Check if ports differ from what's in env file
    local current_http=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    local current_https=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "")
    
    if [ "$http_port" != "$current_http" ] || [ "$https_port" != "$current_https" ]; then
        print_status "Port mismatch detected! Updating .env.dev with actual ports..."
        
        # Update .env.dev with actual ports
        sed -i "s|^FRONTEND_PORT=.*|FRONTEND_PORT=$http_port|" "$ENV_FILE"
        sed -i "s|^FRONTEND_PORT_SSL=.*|FRONTEND_PORT_SSL=$https_port|" "$ENV_FILE"
        
        # Update CORS settings with actual ports
        print_status "Updating CORS settings with actual ports..."
        
        # Detect if using IP or localhost
        local current_app_url=$(grep "^APP_URL=" "$ENV_FILE" | cut -d'=' -f2)
        
        if [[ "$current_app_url" == https://*:* ]]; then
            # IP access - update with actual https port
            local base_url="https://$server_ip:$https_port"
            sed -i "s|^APP_URL=.*|APP_URL=$base_url|" "$ENV_FILE"
            sed -i "s|^CLIENT_URL=.*|CLIENT_URL=$base_url|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$base_url,http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$server_ip,localhost|" "$ENV_FILE"
            print_success "Updated to https://$server_ip:$https_port"
        elif [[ "$current_app_url" == https://* ]]; then
            # Domain - no port change needed
            print_success "Using domain configuration"
        else
            # Localhost
            sed -i "s|^CLIENT_URL=.*|CLIENT_URL=http://localhost:$http_port|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:$http_port|" "$ENV_FILE"
            print_success "Updated to http://localhost:$http_port"
        fi
        
        # If services were started temporarily, restart them with correct env
        if [ "$running" -eq 0 ]; then
            print_status "Restarting services with correct configuration..."
            docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE down 2>/dev/null || true
        fi
    else
        # Ports match, just stop if we started temporarily
        if [ "$running" -eq 0 ]; then
            docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE down 2>/dev/null || true
            print_status "Ports match. Services stopped. Will restart in deploy phase..."
        fi
    fi
}

# Generate missing secrets
generate_missing_secrets() {
    print_status "Generating secure secrets..."
    
    local secrets=(
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "REFRESH_SECRET"
        "ENCRYPTION_KEY"
        "APP_SECRET"
        "COUCHDB_JWT_SECRET"
        "COUCHDB_PASSWORD"
    )
    
    for secret in "${secrets[@]}"; do
        if ! grep -q "^$secret=" "$ENV_FILE" || [ -z "$(grep "^$secret=" "$ENV_FILE" | cut -d'=' -f2)" ]; then
            local value=$(generate_secret)
            if [ "$secret" = "ENCRYPTION_KEY" ]; then
                value=$(openssl rand -hex 32)
            fi
            
            if grep -q "^$secret=" "$ENV_FILE"; then
                sed -i "s|^$secret=.*|$secret=$value|" "$ENV_FILE"
            else
                echo "$secret=$value" >> "$ENV_FILE"
            fi
        fi
    done
}

# Build and deploy the application
deploy() {
    print_header "Building & Deploying ZakApp (Dev Mode)"
    
    print_status "Building images from local source..."
    docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE build
    
    print_status "Starting services..."
    docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE up -d
    
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Wait for backend health check
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps backend 2>/dev/null | grep -q "healthy"; then
            print_success "Backend is ready"
            break
        fi
        
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $retries -eq $max_retries ]; then
        print_warning "Backend may not be fully ready yet, but continuing..."
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE run --rm migrations || print_warning "Migration step completed"
    
    verify_deployment
}

# Verify deployment is successful
verify_deployment() {
    print_header "Verifying Deployment"
    
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTP_PORT")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTPS_PORT")
    local server_ip=$(detect_ip)
    local all_healthy=true
    
    # Check CouchDB
    print_status "Checking CouchDB..."
    if docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps couchdb 2>/dev/null | grep -q "healthy"; then
        print_success "CouchDB is healthy"
    else
        print_warning "CouchDB may not be ready yet"
        all_healthy=false
    fi
    
    # Check Backend
    print_status "Checking Backend..."
    if docker compose -f "$COMPOSE_FILE" $COMPOSE_PROFILE ps backend 2>/dev/null | grep -q "healthy"; then
        print_success "Backend is healthy"
    else
        print_warning "Backend may not be ready yet"
        all_healthy=false
    fi
    
    # Check Frontend via HTTP
    print_status "Checking Frontend HTTP..."
    local frontend_retries=0
    while [ $frontend_retries -lt 10 ]; do
        if curl -sf "http://localhost:$http_port" > /dev/null 2>&1; then
            print_success "Frontend is responding on HTTP"
            break
        fi
        frontend_retries=$((frontend_retries + 1))
        sleep 2
    done
    if [ $frontend_retries -eq 10 ]; then
        print_warning "Frontend may need more time to start"
        all_healthy=false
    fi
    
    # Check API accessibility through proxy
    print_status "Checking API accessibility..."
    local api_retries=0
    while [ $api_retries -lt 10 ]; do
        if curl -sf "http://localhost:$http_port/api/health" > /dev/null 2>&1 || \
           curl -sf "http://localhost:$http_port/api/auth/test" > /dev/null 2>&1; then
            print_success "API is accessible through proxy"
            break
        fi
        api_retries=$((api_retries + 1))
        sleep 2
    done
    if [ $api_retries -eq 10 ]; then
        print_warning "API may need more time or check CORS settings"
        all_healthy=false
    fi
    
    # Summary
    echo ""
    if [ "$all_healthy" = true ]; then
        print_success "All services are healthy and responding!"
    else
        print_warning "Some services may still be starting. Check logs with: docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE logs -f"
    fi
}

# Display access information
show_access_info() {
    print_header "ZakApp Dev Build is Ready!"
    
    local app_url=$(grep "^APP_URL=" "$ENV_FILE" | cut -d'=' -f2)
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTP_PORT")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "$DEFAULT_HTTPS_PORT")
    local server_ip=$(detect_ip)
    
    echo -e "${GREEN}🎉 ZakApp dev build has been successfully deployed!${NC}"
    echo ""
    echo "Access your development application:"
    echo ""
    echo -e "  ${GREEN}Local Access:${NC}  http://localhost:$http_port"
    
    if [[ "$app_url" == https://*:* ]] && [ -n "$server_ip" ]; then
        echo -e "  ${GREEN}Network Access:${NC} https://$server_ip:$https_port"
        echo ""
        echo -e "${YELLOW}⚠️  Note about HTTPS:${NC}"
        echo "   When accessing via IP address, your browser will show a"
        echo "   'Not Secure' warning. This is expected with self-signed certificates."
        echo "   Click 'Advanced' → 'Proceed' to continue."
    fi
    
    echo ""
    echo -e "${BLUE}📋 Development Features:${NC}"
    echo "   - Hot-reload: Code changes in ./client and ./server auto-reload"
    echo "   - Frontend: http://localhost:$http_port"
    echo "   - Backend API: http://localhost:$http_port/api"
    echo ""
    echo -e "${BLUE}📋 Quick Commands:${NC}"
    echo "  # View logs"
    echo "  docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE logs -f"
    echo ""
    echo "  # Stop services"
    echo "  docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE down"
    echo ""
    echo "  # Restart services"
    echo "  docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE restart"
    echo ""
    echo "  # Full rebuild (after package changes)"
    echo "  docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE build --no-cache && docker compose -f $COMPOSE_FILE $COMPOSE_PROFILE up -d"
    echo ""
    echo -e "${GREEN}Happy developing! 🧑‍💻✨${NC}"
}

# Main execution
main() {
    print_header "ZakApp Development Build Deployment"
    echo "Local source with hot-reload support"
    echo ""
    
    check_prerequisites
    setup_environment
    deploy
    show_access_info
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main
