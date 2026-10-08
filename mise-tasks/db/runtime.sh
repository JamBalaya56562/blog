#!/usr/bin/env bash
#MISE hide=true
# Sourced by the db:* tasks beside it, not run on its own. On Windows mise
# registers any file here with a shebang as a task, so this one is hidden from
# the listing; running it defines the functions below and exits.
#
# Resolves the container runtime to use.
#
# wslc is preferred because it is far lighter than Docker Desktop, and a single
# DynamoDB Local container is simple enough to suit it. docker is the fallback.
# Override with RUNTIME=docker to force one.
set -euo pipefail

# Being on PATH is not enough. wslc ships with WSL whether or not its backend
# is running, and an unavailable one fails every command with E_FAIL, so each
# candidate is probed with a harmless listing before it is chosen.
#
# A wedged wslc session does not fail that listing, it never answers it, and
# the probe used to wait on it forever. Each probe is therefore bounded. The
# default leaves room for wslc booting its VM after an idle period, which takes
# 8-18 s. Override with RUNTIME_PROBE_TIMEOUT (seconds).
PROBE_TIMEOUT="${RUNTIME_PROBE_TIMEOUT:-45}"

runtime_works() {
  local status=0
  timeout "$PROBE_TIMEOUT" "$1" ps >/dev/null 2>&1 || status=$?
  if [ "$status" -eq 124 ]; then
    echo "$1 did not answer within ${PROBE_TIMEOUT}s; trying the next runtime." >&2
  fi
  return "$status"
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

  # Both wslc entries are the same program when it is on PATH, so once one has
  # timed out the other would only make the fallback wait twice as long.
  local wslc_hung=0
  for candidate in "${candidates[@]}"; do
    local is_wslc=0
    [[ "$(basename "$candidate")" == wslc* ]] && is_wslc=1
    if [ "$is_wslc" -eq 1 ] && [ "$wslc_hung" -eq 1 ]; then
      continue
    fi

    local status=0
    runtime_works "$candidate" || status=$?
    if [ "$status" -eq 0 ]; then
      echo "$candidate"
      return
    fi
    if [ "$status" -eq 124 ] && [ "$is_wslc" -eq 1 ]; then
      wslc_hung=1
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
