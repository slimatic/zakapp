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

# Where nginx should proxy /api to.
#
# Defaulted here rather than hardcoded in the template, because the same template
# has to work both inside compose (service name `backend`) and on a host that runs
# nginx directly (loopback). An unresolvable upstream makes nginx refuse to start
# outright, so this can never be left empty.
API_PROXY_TARGET="${API_PROXY_TARGET:-http://backend:3001}"
export API_PROXY_TARGET

# Export for envsubst
export CSP_CONNECT_SOURCES="${CSP_CONNECT_SOURCES:-$DEFAULT_CSP}"

# Where nginx should proxy /couchdb/ to.
#
# A full URL in REACT_APP_COUCHDB_URL means the client is configured to talk to
# CouchDB directly, so that host is the right target. A path (the usual '/couchdb')
# means the client expects same-origin, in which case fall back to the compose
# service name.
case "$REACT_APP_COUCHDB_URL" in
  http://*|https://*) COUCHDB_PROXY_TARGET="$REACT_APP_COUCHDB_URL" ;;
  *)                  COUCHDB_PROXY_TARGET="http://couchdb:5984" ;;
esac
export COUCHDB_PROXY_TARGET

echo "Applying CSP Connect Sources: $CSP_CONNECT_SOURCES"
echo "Applying API proxy target: $API_PROXY_TARGET"
echo "Applying CouchDB proxy target: $COUCHDB_PROXY_TARGET"

# Substitute ONLY the variables we control (avoiding $uri and other nginx
# variables). Any new ${...} added to the template must be listed here too, or
# it renders literally and nginx fails to start with "unknown variable".
envsubst '${CSP_CONNECT_SOURCES} ${API_PROXY_TARGET} ${COUCHDB_PROXY_TARGET}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Execute the passed command (nginx)
exec "$@"
