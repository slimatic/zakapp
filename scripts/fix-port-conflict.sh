#!/bin/bash

echo "🔧 ZakApp Port Conflict Resolver"
echo "================================"
echo

# Check if ports are in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  Port $port is in use (needed for $service)"
        local pid=$(lsof -ti:$port)
        echo "   Process PID: $pid"
        echo "   Command: $(ps -p $pid -o comm= 2>/dev/null || echo 'Unknown')"
        return 1
    else
        echo "✅ Port $port is free (for $service)"
        return 0
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port)
    if [ -n "$pids" ]; then
        echo "🔪 Killing processes on port $port: $pids"
        kill -9 $pids 2>/dev/null
        sleep 1
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
            echo "❌ Failed to kill all processes on port $port"
            return 1
        else
            echo "✅ Successfully freed port $port"
            return 0
        fi
    else
        echo "✅ No processes found on port $port"
        return 0
    fi
}

echo "Checking required ports..."
frontend_ok=0
backend_ok=0

check_port 3000 "frontend" && frontend_ok=1
check_port 5000 "backend" && backend_ok=1

if [ $frontend_ok -eq 1 ] && [ $backend_ok -eq 1 ]; then
    echo
    echo "🎉 All ports are free! You can run 'npm run dev' now."
    exit 0
fi

echo
echo "Some ports are in use. Do you want to kill the processes? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo
    echo "Freeing up ports..."
    
    if [ $frontend_ok -eq 0 ]; then
        kill_port 3000
    fi
    
    if [ $backend_ok -eq 0 ]; then
        kill_port 5000
    fi
    
    echo
    echo "✅ Port cleanup complete! You can now run 'npm run dev'."
else
    echo
    echo "ℹ️  Alternative solutions:"
    echo "• Run with different ports: PORT=5001 npm run server:dev"
    echo "• Or manually kill processes: kill -9 \$(lsof -ti:5000)"
    echo "• Or use the commands shown above"
fi