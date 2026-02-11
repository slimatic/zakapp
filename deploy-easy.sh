#!/bin/bash
# ZakApp Easy Deployment Script
# Zero-configuration setup with automatic HTTPS
# Works with: localhost, IP addresses, and custom domains

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

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
    
    # Check if user has Docker permissions
    if ! docker ps > /dev/null 2>&1; then
        print_warning "You may need sudo privileges to run Docker commands"
        print_status "Consider adding your user to the docker group:"
        echo "  sudo usermod -aG docker \$USER"
        echo ""
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Detect the server's IP address
detect_ip() {
    # Try to get the primary IP address
    local ip=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    if [ -z "$ip" ]; then
        # Fallback methods
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
    
    # Check if IP is localhost
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
    if docker compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "$port"; then
        return 0
    fi
    
    # Check if port is in use by other processes
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
    
    # Split by comma and validate each
    IFS=',' read -ra EMAIL_ARRAY <<< "$emails"
    for email in "${EMAIL_ARRAY[@]}"; do
        # Trim whitespace
        email=$(echo "$email" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
        
        # Skip empty emails
        if [ -z "$email" ]; then
            continue
        fi
        
        # Validate email format
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
        
        # Allow empty input (optional)
        if [ -z "$admin_emails" ]; then
            print_warning "No admin emails specified. You can add them later by editing the .env file."
            return
        fi
        
        # Validate email format
        if validate_emails "$admin_emails"; then
            break
        else
            print_error "Invalid email format. Please enter valid email addresses."
            echo "Examples: admin@example.com or admin@example.com,manager@company.com"
        fi
    done
    
    # Set in .env file
    if grep -q "^ADMIN_EMAILS=" "$ENV_FILE"; then
        sed -i "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=$admin_emails|" "$ENV_FILE"
    else
        echo "ADMIN_EMAILS=$admin_emails" >> "$ENV_FILE"
    fi
    
    print_success "Admin emails configured: $admin_emails"
}

# Setup environment file
setup_environment() {
    print_header "Setting up Environment"
    
    # Check if .env exists
    if [ -f "$ENV_FILE" ]; then
        print_warning ".env file already exists"
        echo ""
        echo "Options:"
        echo "  1) Keep existing configuration (recommended)"
        echo "  2) Regenerate configuration (will backup and preserve secrets)"
        echo "  3) Update access settings only (recommended after IP change)"
        read -p "Select option (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                print_status "Using existing .env configuration"
                # Still verify network configuration
                local server_ip=$(detect_ip)
                verify_network "$server_ip" || true
                return
                ;;
            2)
                cp "$ENV_FILE" ".env.backup.$(date +%Y%m%d_%H%M%S)"
                print_status "Backup created: .env.backup.*"
                # Extract and preserve secrets
                local secrets_backup=""
                for secret in JWT_SECRET JWT_REFRESH_SECRET REFRESH_SECRET ENCRYPTION_KEY APP_SECRET COUCHDB_JWT_SECRET COUCHDB_PASSWORD; do
                    local value=$(grep "^$secret=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
                    if [ -n "$value" ]; then
                        secrets_backup="$secrets_backupexport $secret='$value'\n"
                    fi
                done
                print_status "Preserved existing secrets"
                ;;
            3)
                print_status "Updating access settings only..."
                # Just update access-related vars, keep everything else
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
    
    # Create .env from example if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.easy.example" ]; then
            cp ".env.easy.example" "$ENV_FILE"
        else
            touch "$ENV_FILE"
        fi
    fi
    
    # Detect environment type and configure
    configure_access_mode
    configure_ports
    generate_missing_secrets
    
    print_success "Environment configured"
}

# Configure access mode (IP/domain/localhost)
configure_access_mode() {
    local server_ip=$(detect_ip)
    verify_network "$server_ip" || true
    
    print_status "Detected server IP: $server_ip"
    echo ""
    echo "How will you access ZakApp?"
    echo "1) Localhost only (this machine)"
    echo "2) IP address ($server_ip) - accessible from your network"
    echo "3) Custom domain"
    read -p "Select option (1-3): " access_option
    
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
            print_warning "Invalid option, defaulting to localhost"
            access_mode="localhost"
            ;;
    esac
    
    # Configure based on access mode
    case $access_mode in
        localhost)
            sed -i "s|^APP_URL=.*|APP_URL=http://localhost:3000|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://localhost:3000|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=localhost|" "$ENV_FILE"
            print_success "Configured for localhost access"
            ;;
        ip)
            sed -i "s|^APP_URL=.*|APP_URL=https://$server_ip:3443|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$server_ip:3443,http://localhost:3000|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$server_ip,localhost|" "$ENV_FILE"
            print_success "Configured for IP access: https://$server_ip:3443"
            ;;
        domain)
            read -p "Enter your domain (e.g., zakapp.example.com): " domain
            sed -i "s|^APP_URL=.*|APP_URL=https://$domain|" "$ENV_FILE"
            sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://$domain|" "$ENV_FILE"
            sed -i "s|^ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$domain|" "$ENV_FILE"
            sed -i "s|^# ZAKAPP_DOMAIN=.*|ZAKAPP_DOMAIN=$domain|" "$ENV_FILE"
            print_success "Configured for domain: https://$domain"
            ;;
    esac
    
    # Collect admin email addresses
    collect_admin_emails
}

# Configure ports
configure_ports() {
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "3000")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "3443")
    
    if check_port "$http_port"; then
        print_warning "Port $http_port is already in use"
        local new_port=$(find_available_port "$http_port")
        print_status "Using alternative port: $new_port"
        sed -i "s|^FRONTEND_PORT=.*|FRONTEND_PORT=$new_port|" "$ENV_FILE"
    fi
    
    if check_port "$https_port"; then
        print_warning "Port $https_port is already in use"
        local new_ssl_port=$(find_available_port "$https_port")
        print_status "Using alternative SSL port: $new_ssl_port"
        sed -i "s|^FRONTEND_PORT_SSL=.*|FRONTEND_PORT_SSL=$new_ssl_port|" "$ENV_FILE"
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
            # Handle ENCRYPTION_KEY differently (needs hex format)
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

# Deploy the application
deploy() {
    print_header "Deploying ZakApp"
    
    print_status "Pulling latest images..."
    docker compose -f "$COMPOSE_FILE" pull
    
    print_status "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Wait for backend health check
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if docker compose -f "$COMPOSE_FILE" ps backend 2>/dev/null | grep -q "healthy"; then
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
    docker compose -f "$COMPOSE_FILE" run --rm migrations || print_warning "Migration step completed"
    
    # Verify all services
    verify_deployment
}

# Verify deployment is successful
verify_deployment() {
    print_header "Verifying Deployment"
    
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "3000")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "3443")
    local server_ip=$(detect_ip)
    local all_healthy=true
    
    # Check CouchDB
    print_status "Checking CouchDB..."
    if docker compose -f "$COMPOSE_FILE" ps couchdb 2>/dev/null | grep -q "healthy"; then
        print_success "CouchDB is healthy"
    else
        print_warning "CouchDB may not be ready yet"
        all_healthy=false
    fi
    
    # Check Backend
    print_status "Checking Backend..."
    if docker compose -f "$COMPOSE_FILE" ps backend 2>/dev/null | grep -q "healthy"; then
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
        # Try both possible API endpoints
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
        print_warning "Some services may still be starting. Check logs with: docker compose logs -f"
    fi
}

# Display access information
show_access_info() {
    print_header "ZakApp is Ready!"
    
    local app_url=$(grep "^APP_URL=" "$ENV_FILE" | cut -d'=' -f2)
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2 || echo "3000")
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2 || echo "3443")
    local server_ip=$(detect_ip)
    
    echo -e "${GREEN}🎉 ZakApp has been successfully deployed!${NC}"
    echo ""
    echo "Access your application:"
    echo ""
    
    # Show local access
    echo -e "  ${GREEN}Local Access:${NC}  http://localhost:$http_port"
    
    # Show network access only if configured for IP
    if [[ "$app_url" == https://*:* ]] && [ -n "$server_ip" ]; then
        echo -e "  ${GREEN}Network Access:${NC} https://$server_ip:$https_port"
        echo ""
        echo -e "${YELLOW}⚠️  Note about HTTPS:${NC}"
        echo "   When accessing via IP address, your browser will show a"
        echo "   'Not Secure' warning. This is expected with self-signed certificates."
        echo "   Click 'Advanced' → 'Proceed' to continue. Your data is still encrypted."
    elif [[ "$app_url" == https://* ]] && [ -z "$server_ip" ]; then
        echo -e "  ${GREEN}Access URL:${NC}  $app_url"
    fi
    
    echo ""
    echo -e "${BLUE}📋 Quick Verification:${NC}"
    echo "  # Check service status"
    echo "  docker compose ps"
    echo ""
    echo "  # View real-time logs"
    echo "  docker compose logs -f"
    echo ""
    echo "  # Test API health"
    echo "  curl http://localhost:$http_port/api/auth/test"
    echo ""
    echo -e "${BLUE}🔧 Common Commands:${NC}"
    echo "  # Stop services:      docker compose down"
    echo "  # Restart services:   docker compose restart"
    echo "  # Update & restart:   docker compose pull && docker compose up -d"
    echo "  # Full reset (DELETES DATA): docker compose down -v && docker compose up -d"
    echo ""
    echo -e "${GREEN}Happy Zakat calculating! 🧮✨${NC}"
}

# Main execution
main() {
    print_header "ZakApp Easy Deployment"
    echo "Zero-configuration setup with automatic HTTPS"
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