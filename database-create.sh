#!/bin/bash
set -euo pipefail

# database-create.sh
# Idempotently ensure a Fuseki dataset (default: 3DOC) exists.
# Waits for Fuseki to be reachable before attempting creation.
#
# Environment:
#   FUSEKI_PWD  Admin password for Fuseki (default: pw123)
#   FUSEKI_HOST    Hostname of fuseki service (default: fuseki)
#   FUSEKI_PORT    Port of fuseki service (default: 3030)
#   FUSEKI_TIMEOUT Seconds to wait for readiness (default: 180)
#
# Usage:
#   ./database-create.sh [DATASET_NAME]

DATASET_NAME="${1:-3DOC}"
# Load defaults from .env if present. This allows a single place for the default pw123
if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  source .env
fi

# If FUSEKI_PWD not set in the environment, fall back to .env or default pw123
FUSEKI_PWD="${FUSEKI_PWD:-${FUSEKI_PWD:-pw123}}"
FUSEKI_HOST="${FUSEKI_HOST:-fuseki}"
FUSEKI_PORT="${FUSEKI_PORT:-3030}"
FUSEKI_TIMEOUT="${FUSEKI_TIMEOUT:-180}"

BASE_URL="http://${FUSEKI_HOST}:${FUSEKI_PORT}"
PING_URL="${BASE_URL}/$/ping"
DATASETS_URL="${BASE_URL}/$/datasets"

echo "[database-create] Ensuring Fuseki dataset '${DATASET_NAME}' exists (timeout ${FUSEKI_TIMEOUT}s)..."

start_ts=$(date +%s)
while true; do
  if curl -fsS "${PING_URL}" > /dev/null 2>&1; then
    echo "[database-create] Fuseki is reachable."
    break
  fi
  now_ts=$(date +%s)
  elapsed=$((now_ts - start_ts))
  if [ "$elapsed" -ge "$FUSEKI_TIMEOUT" ]; then
    echo "[database-create] ERROR: Fuseki not reachable after ${FUSEKI_TIMEOUT}s." >&2
    exit 1
  fi
  echo "[database-create] Waiting for Fuseki (${elapsed}s elapsed)..."
  sleep 3
done

AUTH_HEADER="Authorization: Basic $(echo -n admin:${FUSEKI_PWD} | base64)"

if curl -fsS -H "${AUTH_HEADER}" "${DATASETS_URL}" | grep -q '"'"${DATASET_NAME}"'"'; then
  echo "[database-create] Dataset '${DATASET_NAME}' already present."
  exit 0
fi

echo "[database-create] Creating dataset '${DATASET_NAME}'..."
if curl -fsS "${DATASETS_URL}" \
  -H "${AUTH_HEADER}" \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  --data "dbName=${DATASET_NAME}&dbType=tdb" > /dev/null; then
  echo "[database-create] Dataset '${DATASET_NAME}' created."
else
  echo "[database-create] WARNING: Failed to create dataset '${DATASET_NAME}'. It may already exist or the server refused the request." >&2
fi

exit 0
