#!/bin/sh

# Generate config.js from environment variables
# This allows changing the API URL and feature flags without rebuilding the container
echo "Generating runtime config.js..."
cat > /usr/share/nginx/html/config.js <<EOF
window.APP_CONFIG = {
  API_BASE_URL: '${REACT_APP_API_BASE_URL:-}',
  FEEDBACK_ENABLED: '${REACT_APP_FEEDBACK_ENABLED:-true}',
  FEEDBACK_WEBHOOK_URL: '${REACT_APP_FEEDBACK_WEBHOOK_URL:-}',
  COUCHDB_URL: '${REACT_APP_COUCHDB_URL:-}'
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js

# Generate nginx.conf from template
echo "Generating nginx.conf from template..."

# Start with safe defaults
# We include http: and https: and wss: schemes broadly to be permissible by default.
DEFAULT_CSP="'self' https: wss: http: data: blob:"

# Helper function to append to CSP if variable is set
append_to_csp() {
  local val="$1"
  if [ -n "$val" ]; then
    # Ignore values starting with / (local paths)
    case "$val" in
      /*)
        ;;
      *)
        DEFAULT_CSP="$DEFAULT_CSP $val"
        ;;
    esac
  fi
}

append_to_csp "$REACT_APP_COUCHDB_URL"
append_to_csp "$APP_URL"
append_to_csp "$REACT_APP_API_BASE_URL"

# Export for envsubst
export CSP_CONNECT_SOURCES="${CSP_CONNECT_SOURCES:-$DEFAULT_CSP}"

echo "Applying CSP Connect Sources: $CSP_CONNECT_SOURCES"

# Substitute ONLY the CSP variable (avoiding $uri and other nginx variables)
envsubst '${CSP_CONNECT_SOURCES}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Execute the passed command (nginx)
exec "$@"
