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
# 8-18 s. Override with RUNTIME_PROBE_TIMEOUT (whole seconds, above 0: GNU
# timeout reads 0 as "no limit at all").
PROBE_TIMEOUT="${RUNTIME_PROBE_TIMEOUT:-45}"
if ! [[ "$PROBE_TIMEOUT" =~ ^[0-9]+$ ]] || [ "$PROBE_TIMEOUT" -eq 0 ]; then
  echo "RUNTIME_PROBE_TIMEOUT must be a whole number of seconds above 0; using 45." >&2
  PROBE_TIMEOUT=45
fi

# macOS ships no `timeout`; Homebrew's coreutils installs it as `gtimeout`.
# Without either, probes run unbounded as they did before. That only loses the
# guard where it is not needed: the wedge is a wslc one, wslc is Windows-only,
# and Git Bash on Windows has `timeout`.
TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi

# Returns 124 when the probe had to be cut off, whatever signal it took.
runtime_works() {
  local status=0
  if [ -z "$TIMEOUT_CMD" ]; then
    "$1" ps >/dev/null 2>&1 || status=$?
    return "$status"
  fi
  # A probe that ignores TERM gets KILL five seconds later; timeout reports
  # that as 128+9. The KILL reaches the whole process group, the subshell
  # included, and the outer group sends bash's "Killed" notice for it to
  # /dev/null instead of the task's output.
  { ("$TIMEOUT_CMD" -k 5 "$PROBE_TIMEOUT" "$1" ps) >/dev/null 2>&1; } 2>/dev/null || status=$?
  if [ "$status" -eq 124 ] || [ "$status" -eq 137 ]; then
    echo "$1 did not answer within ${PROBE_TIMEOUT}s; trying the next runtime." >&2
    return 124
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

  # The first two entries are the same file when wslc is on PATH, so once one
  # has timed out the other would only make the fallback wait twice as long.
  # `-ef` compares the files themselves, so a different wslc earlier on PATH
  # does not get the bundled one skipped. The `${hung[@]+...}` form keeps an
  # empty array legal under `set -u` on bash 3.2, which macOS still ships.
  local hung=()
  for candidate in "${candidates[@]}"; do
    local path="" seen=0 h
    path="$(command -v "$candidate" 2>/dev/null)" || path=""
    if [ -n "$path" ]; then
      for h in ${hung[@]+"${hung[@]}"}; do
        if [ "$path" -ef "$h" ]; then
          seen=1
          break
        fi
      done
    fi
    if [ "$seen" -eq 1 ]; then
      continue
    fi

    local status=0
    runtime_works "$candidate" || status=$?
    if [ "$status" -eq 0 ]; then
      echo "$candidate"
      return
    fi
    if [ "$status" -eq 124 ] && [ -n "$path" ]; then
      hung+=("$path")
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
