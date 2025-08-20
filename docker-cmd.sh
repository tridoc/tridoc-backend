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
exec deno run --allow-net --allow-read=blobs,rdf.ttl --allow-write=blobs,rdf.ttl --allow-run --allow-env=TRIDOC_PWD,OCR_LANG src/main.ts
