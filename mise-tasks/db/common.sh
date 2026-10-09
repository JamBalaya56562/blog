#!/usr/bin/env bash
#MISE hide=true
# Sourced by the db:* tasks beside it, not run on its own. On Windows mise
# registers any file here with a shebang as a task, so this one is hidden from
# the listing; running it defines the values below and exits.
#
# The container runs on Docker. Start Docker Desktop before running these tasks.
set -euo pipefail

CONTAINER_NAME="blog-dynamodb"
OWNER_LABEL="blog.dynamodb.owner"

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
