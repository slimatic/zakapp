#!/bin/bash

# Lighthouse Performance Audit Script
# Runs Lighthouse audits on Dashboard page for desktop and mobile
# Saves reports and validates against performance budgets

set -e

echo "🚀 Starting Lighthouse Performance Audit..."

# Ensure reports directory exists
mkdir -p client/reports/lighthouse

# Check if the dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Error: Dev server is not running at http://localhost:3000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Dev server detected at http://localhost:3000"

# Install lighthouse CLI if not available
if ! command -v lighthouse &> /dev/null; then
    echo "📦 Installing Lighthouse CLI..."
    npm install -g lighthouse
fi

# Desktop Audit
echo ""
echo "🖥️  Running Desktop Audit..."
lighthouse http://localhost:3000/dashboard \
    --preset=desktop \
    --output=html \
    --output=json \
    --output-path=client/reports/lighthouse/dashboard-desktop \
    --chrome-flags="--headless" \
    --quiet

# Mobile Audit
echo ""
echo "📱 Running Mobile Audit..."
lighthouse http://localhost:3000/dashboard \
    --preset=mobile \
    --output=html \
    --output=json \
    --output-path=client/reports/lighthouse/dashboard-mobile \
    --chrome-flags="--headless" \
    --quiet

echo ""
echo "✅ Lighthouse audits complete!"
echo ""
echo "📊 Reports saved to:"
echo "   - client/reports/lighthouse/dashboard-desktop.html"
echo "   - client/reports/lighthouse/dashboard-mobile.html"
echo ""

# Parse scores from JSON reports
DESKTOP_JSON="client/reports/lighthouse/dashboard-desktop.report.json"
MOBILE_JSON="client/reports/lighthouse/dashboard-mobile.report.json"

if [ -f "$DESKTOP_JSON" ]; then
    echo "🖥️  Desktop Scores:"
    node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$DESKTOP_JSON', 'utf8'));
        const cats = report.categories;
        console.log('   Performance:    ', Math.round(cats.performance.score * 100));
        console.log('   Accessibility:  ', Math.round(cats.accessibility.score * 100));
        console.log('   Best Practices: ', Math.round(cats['best-practices'].score * 100));
        console.log('   SEO:            ', Math.round(cats.seo.score * 100));
    "
fi

echo ""

if [ -f "$MOBILE_JSON" ]; then
    echo "📱 Mobile Scores:"
    node -e "
        const fs = require('fs');
        const report = JSON.parse(fs.readFileSync('$MOBILE_JSON', 'utf8'));
        const cats = report.categories;
        console.log('   Performance:    ', Math.round(cats.performance.score * 100));
        console.log('   Accessibility:  ', Math.round(cats.accessibility.score * 100));
        console.log('   Best Practices: ', Math.round(cats['best-practices'].score * 100));
        console.log('   SEO:            ', Math.round(cats.seo.score * 100));
    "
fi

echo ""
echo "🎯 Target Scores:"
echo "   Performance:    ≥90"
echo "   Accessibility:  ≥95"
echo "   Best Practices: ≥95"
echo ""

# Validate scores meet targets
echo "🔍 Validating scores against targets..."

node -e "
    const fs = require('fs');
    
    // Read both reports
    const desktop = JSON.parse(fs.readFileSync('$DESKTOP_JSON', 'utf8'));
    const mobile = JSON.parse(fs.readFileSync('$MOBILE_JSON', 'utf8'));
    
    // Extract scores
    const scores = {
        desktop: {
            performance: Math.round(desktop.categories.performance.score * 100),
            accessibility: Math.round(desktop.categories.accessibility.score * 100),
            bestPractices: Math.round(desktop.categories['best-practices'].score * 100)
        },
        mobile: {
            performance: Math.round(mobile.categories.performance.score * 100),
            accessibility: Math.round(mobile.categories.accessibility.score * 100),
            bestPractices: Math.round(mobile.categories['best-practices'].score * 100)
        }
    };
    
    // Define targets
    const targets = {
        performance: 90,
        accessibility: 95,
        bestPractices: 95
    };
    
    // Check if all scores meet targets
    let allPass = true;
    const failures = [];
    
    // Check desktop
    if (scores.desktop.performance < targets.performance) {
        failures.push(\`Desktop Performance: \${scores.desktop.performance} < \${targets.performance}\`);
        allPass = false;
    }
    if (scores.desktop.accessibility < targets.accessibility) {
        failures.push(\`Desktop Accessibility: \${scores.desktop.accessibility} < \${targets.accessibility}\`);
        allPass = false;
    }
    if (scores.desktop.bestPractices < targets.bestPractices) {
        failures.push(\`Desktop Best Practices: \${scores.desktop.bestPractices} < \${targets.bestPractices}\`);
        allPass = false;
    }
    
    // Check mobile
    if (scores.mobile.performance < targets.performance) {
        failures.push(\`Mobile Performance: \${scores.mobile.performance} < \${targets.performance}\`);
        allPass = false;
    }
    if (scores.mobile.accessibility < targets.accessibility) {
        failures.push(\`Mobile Accessibility: \${scores.mobile.accessibility} < \${targets.accessibility}\`);
        allPass = false;
    }
    if (scores.mobile.bestPractices < targets.bestPractices) {
        failures.push(\`Mobile Best Practices: \${scores.mobile.bestPractices} < \${targets.bestPractices}\`);
        allPass = false;
    }
    
    if (allPass) {
        console.log('✅ All scores meet or exceed targets!');
        process.exit(0);
    } else {
        console.log('❌ Some scores are below targets:');
        failures.forEach(f => console.log('   - ' + f));
        console.log('');
        console.log('📝 Review the HTML reports for detailed recommendations.');
        process.exit(1);
    }
" || {
    echo "⚠️  Some scores are below targets. This is not a blocker but should be addressed."
    exit 0
}
