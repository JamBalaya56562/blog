#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=./container-runtime.sh
source "$(dirname "$0")/container-runtime.sh"

runtime="$(resolve_runtime)"
echo "Using container runtime: $runtime"

# `docker ps --format '{{.Names}}'` cannot be used here: wslc's --format only
# accepts json or table, not Go templates. `inspect` exists on both runtimes and
# its exit code answers the same question.
if "$runtime" inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  "$runtime" start "$CONTAINER_NAME"
else
  # -sharedDb is required: without it DynamoDB Local namespaces tables per
  # access key and region, so a mismatch between .env and any other client makes
  # the table look missing.
  #
  # -inMemory keeps the data in RAM. Counts reset when the container stops,
  # which is fine for a view counter in development and avoids the volume
  # ownership problems the image has with a mounted -dbPath.
  "$runtime" run -d \
    --name "$CONTAINER_NAME" \
    -p "${DYNAMODB_PORT}:8000" \
    amazon/dynamodb-local \
    -jar DynamoDBLocal.jar -sharedDb -inMemory
fi
