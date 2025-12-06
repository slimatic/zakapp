#!/bin/bash
# Script to get your local IP address for CORS configuration
# Usage: ./get-ip.sh

echo "🌐 ZakApp - Get Local IP Address"
echo "=================================="
echo ""

# Detect OS
if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    # WSL (Windows Subsystem for Linux)
    # We need to use the Windows IP, not the WSL internal IP
    # Try to find the IP that looks like a LAN IP (192.168.x.x or 10.x.x.x but not the internal WSL one)
    IP=$(ipconfig.exe | grep "IPv4" | grep -v "172\." | grep -v "10\.255\." | head -n 1 | awk -F': ' '{print $2}' | tr -d '\r')
    
    if [ -z "$IP" ]; then
        # Fallback if filtering was too aggressive
        IP=$(ipconfig.exe | grep "IPv4" | head -n 1 | awk -F': ' '{print $2}' | tr -d '\r')
    fi

    echo "📍 Your local IP address (WSL Host): $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open the .env file in the root directory."
    echo "2. Update the HOST_IP variable:"
    echo "   HOST_IP=$IP"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose up -d"
    echo ""
    echo "4. Access from your device:"
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001"

elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    # Try to get the IP used for internet connection (most reliable)
    if command -v ip >/dev/null 2>&1; then
        IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+')
    fi
    
    # Fallback methods if the above fails
    if [ -z "$IP" ] && command -v hostname >/dev/null 2>&1; then
        IP=$(hostname -I | awk '{print $1}')
    fi
    
    if [ -z "$IP" ]; then
        IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d'/' -f1 | head -n1)
    fi

    echo "📍 Your local IP address: $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open the .env file in the root directory."
    echo "2. Update the HOST_IP variable:"
    echo "   HOST_IP=$IP"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose up -d"
    echo ""
    echo "4. Access from your device:"
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001"
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    # Try to get the IP of the default interface
    DEFAULT_IF=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}')
    if [ -n "$DEFAULT_IF" ]; then
        IP=$(ipconfig getifaddr "$DEFAULT_IF")
    fi
    
    # Fallback
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    fi

    echo "📍 Your local IP address: $IP"
    echo ""
    echo "To access ZakApp from another device on your network:"
    echo "1. Open the .env file in the root directory."
    echo "2. Update the HOST_IP variable:"
    echo "   HOST_IP=$IP"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose up -d"
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
    echo "1. Open the .env file in the root directory."
    echo "2. Update the HOST_IP variable:"
    echo "   HOST_IP=$IP"
    echo ""
    echo "3. Restart Docker:"
    echo "   docker compose up -d"
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
