#!/bin/sh

# Generate config.js from environment variables
# This allows changing the API URL and feature flags without rebuilding the container
echo "Generating runtime config.js..."
cat > /app/client/public/config.js <<EOF
window.APP_CONFIG = {
  API_BASE_URL: '${REACT_APP_API_BASE_URL:-}',
  FEEDBACK_ENABLED: '${REACT_APP_FEEDBACK_ENABLED:-true}',
  FEEDBACK_WEBHOOK_URL: '${REACT_APP_FEEDBACK_WEBHOOK_URL:-}'
};
EOF

echo "Runtime config generated:"
cat /app/client/public/config.js

# Execute the passed command (npm start)
exec "$@"
