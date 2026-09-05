#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=./container-runtime.sh
source "$(dirname "$0")/container-runtime.sh"

# amazon/dynamodb-local ships no HEALTHCHECK, so `inspect .State.Health.Status`
# never reports anything. Poll the endpoint instead: DynamoDB Local answers a
# bare GET with HTTP 400, which is enough to prove it is listening and serving.
url="http://localhost:${DYNAMODB_PORT}"

echo "Waiting for DynamoDB Local to be healthy..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$url" | grep -qE '^[2-5][0-9][0-9]$'; then
    echo "DynamoDB Local is healthy!"
    exit 0
  fi
  echo "  Attempt $i/30 — $url is not responding yet"
  sleep 1
done

echo "ERROR: DynamoDB Local did not become healthy in time"
exit 1
