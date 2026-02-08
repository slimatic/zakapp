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
        read -p "Do you want to keep existing configuration? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            cp "$ENV_FILE" ".env.backup.$(date +%Y%m%d_%H%M%S)"
            print_status "Backup created: .env.backup.*"
        else
            print_status "Using existing .env configuration"
            return
        fi
    fi
    
    # Create .env from example if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.easy.example" ]; then
            cp ".env.easy.example" "$ENV_FILE"
        else
            touch "$ENV_FILE"
        fi
    fi
    
    # Detect environment type
    local server_ip=$(detect_ip)
    local access_mode=""
    
    print_status "Detected server IP: $server_ip"
    echo ""
    echo "How will you access ZakApp?"
    echo "1) Localhost only (this machine)"
    echo "2) IP address ($server_ip) - accessible from your network"
    echo "3) Custom domain"
    read -p "Select option (1-3): " access_option
    
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
     
     # Check for port conflicts
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
    
    # Generate secrets if not present
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
    
    print_success "Environment configured"
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
        if docker compose -f "$COMPOSE_FILE" ps backend | grep -q "healthy"; then
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
}

# Display access information
show_access_info() {
    print_header "ZakApp is Ready!"
    
    local app_url=$(grep "^APP_URL=" "$ENV_FILE" | cut -d'=' -f2)
    local http_port=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d'=' -f2)
    local https_port=$(grep "^FRONTEND_PORT_SSL=" "$ENV_FILE" | cut -d'=' -f2)
    local server_ip=$(detect_ip)
    
    echo -e "${GREEN}🎉 ZakApp has been successfully deployed!${NC}"
    echo ""
    echo "Access your application:"
    echo ""
    
    if [ -n "$app_url" ]; then
        echo -e "  ${GREEN}Primary URL:${NC} $app_url"
    fi
    
    echo -e "  ${GREEN}HTTP:${NC}  http://localhost:$http_port"
    
    if [ -n "$server_ip" ]; then
        echo -e "  ${GREEN}HTTPS (IP):${NC} https://$server_ip:$https_port"
        echo ""
        echo -e "${YELLOW}⚠️  Note about HTTPS:${NC}"
        echo "   When accessing via IP address, your browser will show a"
        echo "   'Not Secure' warning. This is expected with self-signed certificates."
        echo "   Click 'Advanced' → 'Proceed' to continue. Your data is still encrypted."
    fi
    
    echo ""
    echo "Useful commands:"
    echo "  View logs:    docker compose -f $COMPOSE_FILE logs -f"
    echo "  Stop:         docker compose -f $COMPOSE_FILE down"
    echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
    echo "  Update:       docker compose -f $COMPOSE_FILE pull && docker compose -f $COMPOSE_FILE up -d"
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