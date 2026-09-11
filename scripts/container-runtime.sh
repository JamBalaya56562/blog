#!/usr/bin/env bash
# Resolves the container runtime to use, shared by the db:* scripts.
#
# wslc is preferred because it is far lighter than Docker Desktop, and a single
# DynamoDB Local container is simple enough to suit it. docker is the fallback.
# Override with RUNTIME=docker to force one.
set -euo pipefail

# Being on PATH is not enough. wslc ships with Windows whether or not its
# backend is running, and an unavailable one fails every command with E_FAIL, so
# each candidate is probed with a harmless listing before it is chosen.
#
# The probe has to be asked in each runtime's own dialect: `list` is wslc's, and
# `docker list` is not a docker command at all, so probing docker with it fails
# on a working daemon and drops docker from the candidates entirely.
runtime_works() {
  case "$1" in
    *wslc*) "$1" list >/dev/null 2>&1 ;;
    *) "$1" ps >/dev/null 2>&1 ;;
  esac
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

# The port the container publishes is read back out of the endpoint the clients
# are given, rather than declared a second time beside it. Two values that have
# to be changed together are two values that drift apart, and a container on one
# port with a client on another fails as an empty table rather than as a
# connection error.
: "${DYNAMODB_ENDPOINT:?must be set by mise — run these through \`mise run\`}"
DYNAMODB_PORT="${DYNAMODB_ENDPOINT##*:}"
case "$DYNAMODB_PORT" in
  '' | *[!0-9]*)
    echo "ERROR: DYNAMODB_ENDPOINT ($DYNAMODB_ENDPOINT) names no port." >&2
    exit 1
    ;;
esac
