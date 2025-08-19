#!/bin/bash

echo "Setting up Tridoc Backend development environment..."

# Wait for Fuseki to be ready
echo "Waiting for Fuseki to start (timeout 180s)..."
FUSEKI_TIMEOUT=180
FUSEKI_START=$(date +%s)
while true; do
    if curl -fsS http://fuseki:3030/$/ping > /dev/null 2>&1; then
        echo "Fuseki is ready!"
        break
    fi
    NOW=$(date +%s)
    ELAPSED=$((NOW - FUSEKI_START))
    if [ "$ELAPSED" -ge "$FUSEKI_TIMEOUT" ]; then
        echo "ERROR: Fuseki did not become ready within ${FUSEKI_TIMEOUT}s. Skipping dataset bootstrap. Check 'fuseki' service logs." >&2
        break
    fi
    echo "Waiting for Fuseki (${ELAPSED}s elapsed)..."
    sleep 3
done

# Cache Deno dependencies if deps.ts exists
if [ -f "src/deps.ts" ]; then
    echo "Caching Deno dependencies..."
    deno cache src/deps.ts
fi

if curl -fsS http://fuseki:3030/$/ping > /dev/null 2>&1; then
    AUTH_HEADER="Authorization: Basic $(echo -n admin:${TRIDOC_PWD:-pw123} | base64)"
    echo "Ensuring Dataset '3DOC' exists..."
    if curl -fsS -H "$AUTH_HEADER" http://fuseki:3030/$/datasets | grep -q '"3DOC"'; then
        echo "Dataset '3DOC' already exists."
    else
        if curl -fsS 'http://fuseki:3030/$/datasets' \
            -H "$AUTH_HEADER" \
            -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
            --data 'dbName=3DOC&dbType=tdb' ; then
            echo "Dataset '3DOC' created."
        else
            echo "WARNING: Failed to create dataset '3DOC'. It may already exist or Fuseki refused the request." >&2
        fi
    fi
else
    echo "Skipping dataset creation because Fuseki is not reachable."
fi

echo "Development environment setup complete!"
echo ""
echo "You can now run the Tridoc backend with:"
echo "deno run --watch --allow-net --allow-read=blobs,rdf.ttl --allow-write=blobs,rdf.ttl --allow-run --allow-env=TRIDOC_PWD,OCR_LANG src/main.ts"
echo ""
echo "Fuseki is available at:"
echo "- Internal: http://fuseki:3030"
echo "- External: http://localhost:8001"
