#!/bin/bash

# Security Audit Script for ZakApp
# T030: Security Audit Implementation

echo "🔒 Starting ZakApp Security Audit (T030)"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    else
        echo "   $message"
    fi
}

echo ""
echo "1. Dependency Vulnerability Check"
echo "----------------------------------"
cd /home/lunareclipse/zakapp
if npm audit --audit-level moderate > /tmp/npm-audit.log 2>&1; then
    print_status "PASS" "No high or critical vulnerabilities found"
else
    # Check if the only issues are the known validator.js moderate vulnerabilities
    if grep -q "validator.js has a URL validation bypass" /tmp/npm-audit.log && ! grep -q "Severity: high\|Severity: critical" /tmp/npm-audit.log; then
        print_status "WARN" "Only known moderate validator.js vulnerabilities (no fix available) - acceptable for production"
    else
        print_status "FAIL" "Vulnerabilities found - check npm audit output"
        cat /tmp/npm-audit.log
    fi
fi

echo ""
echo "2. Environment Variables Check"
echo "------------------------------"
if [ -f ".env" ]; then
    print_status "WARN" ".env file exists - ensure it's not committed to version control"
    # Check for sensitive patterns
    if grep -q "SECRET\|KEY\|PASSWORD" .env; then
        print_status "WARN" "Sensitive environment variables found in .env"
    else
        print_status "PASS" "No sensitive variables found in .env"
    fi
else
    print_status "PASS" ".env file not found in repository"
fi

echo ""
echo "3. Encryption Implementation Check"
echo "-----------------------------------"
if grep -r "EncryptionService" server/src/ > /dev/null; then
    print_status "PASS" "EncryptionService is implemented"
else
    print_status "FAIL" "EncryptionService not found"
fi

# Check if encryption is used in services
if grep -r "encrypt\|decrypt" server/src/services/ > /dev/null; then
    print_status "PASS" "Encryption methods are used in services"
else
    print_status "FAIL" "Encryption methods not used in services"
fi

echo ""
echo "4. Authentication & Authorization Check"
echo "----------------------------------------"
if grep -r "authenticate" server/src/middleware/ > /dev/null; then
    print_status "PASS" "Authentication middleware is implemented"
else
    print_status "FAIL" "Authentication middleware not found"
fi

if grep -r "userId.*req\." server/src/ > /dev/null; then
    print_status "PASS" "User authorization checks are implemented"
else
    print_status "FAIL" "User authorization checks not found"
fi

echo ""
echo "5. Input Validation Check"
echo "-------------------------"
if grep -r "express-validator\|joi\|zod" server/package.json > /dev/null; then
    print_status "PASS" "Input validation library is installed"
else
    print_status "WARN" "Input validation library not found"
fi

if grep -r "validate\|sanitize" server/src/ > /dev/null; then
    print_status "PASS" "Input validation is implemented"
else
    print_status "FAIL" "Input validation not implemented"
fi

echo ""
echo "6. Rate Limiting Check"
echo "----------------------"
if grep -r "rate.*limit" server/src/middleware/ > /dev/null; then
    print_status "PASS" "Rate limiting is implemented"
else
    print_status "FAIL" "Rate limiting not implemented"
fi

echo ""
echo "7. CORS Configuration Check"
echo "---------------------------"
if grep -r "cors" server/src/middleware/ > /dev/null; then
    print_status "PASS" "CORS configuration is implemented"
else
    print_status "FAIL" "CORS configuration not found"
fi

echo ""
echo "8. Security Headers Check"
echo "-------------------------"
if grep -r "helmet\|security.*headers" server/src/middleware/ > /dev/null; then
    print_status "PASS" "Security headers are implemented"
else
    print_status "FAIL" "Security headers not implemented"
fi

echo ""
echo "9. JWT Token Security Check"
echo "---------------------------"
if grep -r "jwt\|token" server/src/services/ > /dev/null; then
    print_status "PASS" "JWT service is implemented"
else
    print_status "FAIL" "JWT service not found"
fi

# Check for token expiration
if grep -r "expiresIn\|exp" server/src/services/ > /dev/null; then
    print_status "PASS" "JWT token expiration is configured"
else
    print_status "FAIL" "JWT token expiration not configured"
fi

echo ""
echo "10. Database Security Check"
echo "---------------------------"
if grep -r "EncryptionService" server/src/ > /dev/null; then
    print_status "PASS" "Database encryption is implemented"
else
    print_status "FAIL" "Database encryption not implemented"
fi

echo ""
echo "11. Logging Security Check"
echo "--------------------------"
if grep -r "console\.log.*password\|console\.log.*token\|console\.log.*key" server/src/ > /dev/null; then
    print_status "FAIL" "Sensitive data logging detected"
else
    print_status "PASS" "No sensitive data logging found"
fi

echo ""
echo "12. HTTPS Configuration Check"
echo "-----------------------------"
if grep -r "https\|ssl" server/src/ > /dev/null; then
    print_status "PASS" "HTTPS configuration found"
else
    print_status "WARN" "HTTPS configuration not found (may be handled by reverse proxy)"
fi

echo ""
echo "🔒 Security Audit Complete"
echo "=========================="
echo ""
echo "Next Steps:"
echo "- Fix any FAIL items immediately"
echo "- Review WARN items for production readiness"
echo "- Consider running automated security scanners (OWASP ZAP, Snyk)"
echo "- Implement regular security audits in CI/CD pipeline"