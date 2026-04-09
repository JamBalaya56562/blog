#!/usr/bin/env bash
set -euo pipefail

container_name="blog-postgres"

if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
  docker start "$container_name"
else
  docker run -d \
    --name "$container_name" \
    -e POSTGRES_USER=blog \
    -e POSTGRES_PASSWORD=blog_dev_password \
    -e POSTGRES_DB=blog \
    -p 5433:5432 \
    -v blog-pgdata:/var/lib/postgresql \
    --health-cmd "pg_isready -U blog -d blog" \
    --health-interval 2s \
    --health-timeout 5s \
    --health-retries 10 \
    postgres:18-alpine
fi
