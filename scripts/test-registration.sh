#!/bin/bash

echo "==================================="
echo "Testing ZakApp User Registration"
echo "==================================="
echo ""

# Test server health
echo "1. Testing server health..."
HEALTH=$(curl -s http://localhost:3001/health)
echo "   Response: $HEALTH"
echo ""

# Register a new user
echo "2. Registering new user: finaltest@zakapp.local..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"finaltest@zakapp.local","password":"Test123!","firstName":"Final","lastName":"Test"}')

echo "   Response: $REGISTER_RESPONSE"
echo ""

# Check if user exists in database
echo "3. Checking database for user..."
cd /home/lunareclipse/zakapp/server
USER_EXISTS=$(sqlite3 prisma/data/dev.db "SELECT COUNT(*) FROM users WHERE email='finaltest@zakapp.local';")

if [ "$USER_EXISTS" -gt 0 ]; then
    echo "   ✅ SUCCESS! User found in database"
    sqlite3 prisma/data/dev.db "SELECT id, email, createdAt FROM users WHERE email='finaltest@zakapp.local';"
else
    echo "   ❌ FAILED! User not found in database"
    echo ""
    echo "4. Checking all users in database..."
    sqlite3 prisma/data/dev.db "SELECT id, email FROM users;"
fi

echo ""
echo "==================================="
echo "Test Complete"
echo "==================================="
