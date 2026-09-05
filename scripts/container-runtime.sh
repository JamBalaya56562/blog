#!/usr/bin/env bash
# Resolves the container runtime to use, shared by the db:* scripts.
#
# wslc is preferred because it is far lighter than Docker Desktop, and a single
# DynamoDB Local container is simple enough to suit it. docker is the fallback.
# Override with RUNTIME=docker to force one.
set -euo pipefail

# Being on PATH is not enough. wslc ships with Windows whether or not its
# backend is running, and an unavailable one fails every command with E_FAIL, so
# each candidate is probed with a harmless `list` before it is chosen.
runtime_works() {
  "$1" list >/dev/null 2>&1
}

resolve_runtime() {
  if [ -n "${RUNTIME:-}" ]; then
    echo "$RUNTIME"
    return
  fi

  local candidates=(
    "wslc"
    "/c/Program Files/WSL/wslc.exe"
    "docker"
  )

  for candidate in "${candidates[@]}"; do
    if runtime_works "$candidate"; then
      echo "$candidate"
      return
    fi
  done

  echo "ERROR: no working container runtime found. Tried wslc and docker." >&2
  echo "Start Docker Desktop, or set RUNTIME to one that works." >&2
  exit 1
}

CONTAINER_NAME="blog-dynamodb"
DYNAMODB_PORT="${DYNAMODB_PORT:-8000}"
