#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for PostgreSQL to be healthy..."
for i in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' blog-postgres 2>/dev/null || echo "not_found")
  if [ "$status" = "healthy" ]; then
    echo "PostgreSQL is healthy!"
    exit 0
  fi
  echo "  Attempt $i/30 — status: $status"
  sleep 1
done
echo "ERROR: PostgreSQL did not become healthy in time"
exit 1
