
#!/bin/sh
echo "Checking connection to CouchDB..."
curl -s http://admin:password@couchdb:5984/ | grep "couchdb" || echo "Failed to connect"

echo "\nListing all databases:"
curl -s http://admin:password@couchdb:5984/_all_dbs

echo "\nChecking ZakApp Databases:"
for db in zakapp_assets zakapp_liabilities zakapp_nisab_year_records zakapp_payment_records zakapp_user_settings zakapp_zakat_calculations; do
    echo "\n--- $db ---"
    # Check info
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://admin:password@couchdb:5984/$db)
    echo "Status: $STATUS"
    
    if [ "$STATUS" = "200" ]; then
        # Check security
        echo "Security:"
        curl -s http://admin:password@couchdb:5984/$db/_security
        # Check document count
        echo "\nDoc Count:"
        curl -s http://admin:password@couchdb:5984/$db | grep doc_count
    else
        echo "DOES NOT EXIST!"
    fi
done
