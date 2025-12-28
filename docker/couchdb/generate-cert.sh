#!/bin/sh
set -e

CERT_DIR="/opt/couchdb/etc/certs"
CERT_FILE="$CERT_DIR/couchdb.pem"
KEY_FILE="$CERT_DIR/privkey.pem"

# Create certs directory
mkdir -p "$CERT_DIR"
chmod 700 "$CERT_DIR"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Generating self-signed SSL certificate for CouchDB..."
    
    # Generate request config
    cat > "$CERT_DIR/openssl.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C=US
ST=State
L=City
O=ZakApp
OU=Database
CN=localhost
EOF

    # Generate certificate and key
    openssl req -newkey rsa:2048 -nodes -keyout "$KEY_FILE" -x509 -days 365 -out "$CERT_FILE" -config "$CERT_DIR/openssl.cnf"
    
    # Set permissions
    chmod 600 "$KEY_FILE" "$CERT_FILE"
    echo "SSL certificate generated at $CERT_DIR"
else
    echo "SSL certificates already exist, skipping generation."
fi
