#!/bin/bash
echo "Checking services..."
echo ""

# Check backend
echo -n "Backend (http://localhost:5001): "
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check frontend
echo -n "Frontend (http://localhost:3000): "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi
