#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=./container-runtime.sh
source "$(dirname "$0")/container-runtime.sh"

runtime="$(resolve_runtime)"
"$runtime" stop "$CONTAINER_NAME"
