#!/bin/bash
# Script to get your local IP address for CORS configuration
# Usage: ./get-ip.sh

echo "🌐 ZakApp - Get Local IP Address"
echo "=================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -n1)
    echo "📍 Your local IP address: $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open .env.docker and add this line:"
    echo "   ALLOWED_ORIGINS=http://localhost:3000,http://$IP:3000"
    echo ""
    echo "2. Update client/.env to use your IP:"
    echo "   REACT_APP_API_BASE_URL=http://$IP:3001/api"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose restart"
    echo ""
    echo "4. Access from your device:"
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    echo "📍 Your local IP address: $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open .env.docker and add this line:"
    echo "   ALLOWED_ORIGINS=http://localhost:3000,http://$IP:3000"
    echo ""
    echo "2. Update client/.env to use your IP:"
    echo "   REACT_APP_API_BASE_URL=http://$IP:3001/api"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose restart"
    echo ""
    echo "4. Access from your device:"
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001"
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -n1)
    echo "📍 Your local IP address: $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open .env.docker and add this line:"
    echo "   ALLOWED_ORIGINS=http://localhost:3000,http://$IP:3000"
    echo ""
    echo "2. Update client/.env to use your IP:"
    echo "   REACT_APP_API_BASE_URL=http://$IP:3001/api"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose restart"
    echo ""
    echo "4. Access from your device:"
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001"
else
    echo "❌ Unsupported operating system"
    exit 1
fi

echo ""
echo "📖 For detailed instructions, see: CORS_CONFIGURATION.md"
