#!/bin/bash

echo "Setting up Tridoc Backend development environment..."

# Ensure dataset exists using shared script (waits for Fuseki internally)
if [ -f "./database-create.sh" ]; then
    bash ./database-create.sh 3DOC || echo "(setup-dev) Dataset ensure script exited with non-zero status; continuing."
else
    echo "(setup-dev) WARNING: database-create.sh not found; skipping dataset ensure."
fi

# Cache Deno dependencies if deps.ts exists
if [ -f "src/deps.ts" ]; then
    echo "Caching Deno dependencies..."
    deno cache src/deps.ts
fi

echo "Dataset bootstrap (if needed) complete."

echo "Development environment setup complete!"
echo ""
echo "You can now run the Tridoc backend with:"
echo "deno run --watch --allow-net --allow-read=blobs,rdf.ttl --allow-write=blobs,rdf.ttl --allow-run --allow-env=TRIDOC_PWD,FUSEKI_PWD,OCR_LANG src/main.ts"
echo ""
echo "Fuseki is available at:"
echo "- Internal: http://fuseki:3030"
echo "- External: http://localhost:8001"
