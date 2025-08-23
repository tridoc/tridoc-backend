#!/bin/bash
set -euo pipefail

echo "[docker-cmd] Starting Tridoc backend..."

# Ensure dataset exists (idempotent)
if [ -f "./database-create.sh" ]; then
    bash ./database-create.sh 3DOC || echo "[docker-cmd] Dataset ensure script failed (continuing)." >&2
else
    echo "[docker-cmd] database-create.sh missing; proceeding without dataset bootstrap." >&2
fi

echo "[docker-cmd] Launching Deno application..."
exec deno run --no-prompt --allow-net --allow-read=blobs,rdf.ttl,/tmp --allow-write=blobs,rdf.ttl,/tmp --allow-run --allow-env=TRIDOC_PWD,FUSEKI_PWD,OCR_LANG src/main.ts
