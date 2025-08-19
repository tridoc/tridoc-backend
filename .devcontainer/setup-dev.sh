#!/bin/bash

echo "Setting up Tridoc Backend development environment..."

# Wait for Fuseki to be ready
echo "Waiting for Fuseki to start..."
until curl -s http://fuseki:3030/$/ping > /dev/null; do
    echo "Waiting for Fuseki..."
    sleep 2
done

echo "Fuseki is ready!"

# Cache Deno dependencies if deps.ts exists
if [ -f "src/deps.ts" ]; then
    echo "Caching Deno dependencies..."
    deno cache src/deps.ts
fi

# Create the 3DOC dataset in Fuseki
echo "Creating Dataset '3DOC' in Fuseki..."
curl 'http://fuseki:3030/$/datasets' \
    -H "Authorization: Basic $(echo -n admin:${TRIDOC_PWD:-pw123} | base64)" \
    -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
    --data 'dbName=3DOC&dbType=tdb' \
    --max-time 10 \
    --retry 3

echo "Development environment setup complete!"
echo ""
echo "You can now run the Tridoc backend with:"
echo "deno run --watch --allow-net --allow-read=blobs,rdf.ttl --allow-write=blobs,rdf.ttl --allow-run --allow-env=TRIDOC_PWD,OCR_LANG src/main.ts"
echo ""
echo "Fuseki is available at:"
echo "- Internal: http://fuseki:3030"
echo "- External: http://localhost:8001"
