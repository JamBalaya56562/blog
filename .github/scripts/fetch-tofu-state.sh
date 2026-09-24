#!/usr/bin/env bash
# Restores the OpenTofu state from the newest `tofu-state` artifact that a
# trusted run produced, and writes only `terraform.tfstate` into the directory
# given as the first argument.
#
# Usage: fetch-tofu-state.sh <dir>
#   Needs `gh` (authenticated), `jq` and `unzip`, and GITHUB_REPOSITORY set to
#   owner/name. Writes `found=true|false` to $GITHUB_OUTPUT when it is set.
#   Exits 0 whether or not a state was found; what a missing state means is the
#   caller's decision. Any other failure — the API, the download, a zip without
#   a state in it — exits non-zero.
#
# Why "trusted": an artifact is looked up by name, and any run in the
# repository can upload one under that name — including a pull request's, which
# runs the workflow files from the pull request. The apply job used to take the
# newest one whatever made it and unzip all of it into `infra/`, so an artifact
# carrying a `.tf` file of its own would have run under the apply role. Only a
# run of the apply or backup workflow, on `main`, in this repository and not a
# fork, started by a push, a schedule or a dispatch, is taken; anything else is
# skipped with a warning. And only the state file is extracted, after checking
# it parses as one.
set -euo pipefail

dest=${1:?usage: fetch-tofu-state.sh <dir>}
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be owner/name}"
output=${GITHUB_OUTPUT:-/dev/null}

repo_id=$(gh api "repos/${GITHUB_REPOSITORY}" --jq .id)

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Newest first. Tab-separated: created_at, artifact id, run id, branch, the
# repository the run's code came from, the repository the run belongs to.
gh api --paginate "repos/${GITHUB_REPOSITORY}/actions/artifacts?name=tofu-state&per_page=100" \
  --jq '.artifacts[] | select(.expired == false)
        | [.created_at, .id, .workflow_run.id, .workflow_run.head_branch,
           .workflow_run.head_repository_id, .workflow_run.repository_id]
        | @tsv' |
  sort -r >"$tmp/candidates"

while IFS=$'\t' read -r created id run branch head_repo run_repo; do
  if [ "$branch" != "main" ] || [ "$head_repo" != "$repo_id" ] || [ "$run_repo" != "$repo_id" ]; then
    echo "::warning::Skipping tofu-state artifact ${id} (${created}): it came from branch '${branch}' of repository ${head_repo}, not main of this one."
    continue
  fi

  read -r path event < <(gh api "repos/${GITHUB_REPOSITORY}/actions/runs/${run}" --jq '"\(.path) \(.event)"')
  case "$path" in
  .github/workflows/tofu-apply.yml | .github/workflows/tofu-state-backup.yml) ;;
  *)
    echo "::warning::Skipping tofu-state artifact ${id} (${created}): uploaded by ${path}, which does not own the state."
    continue
    ;;
  esac
  case "$event" in
  push | schedule | workflow_dispatch) ;;
  *)
    echo "::warning::Skipping tofu-state artifact ${id} (${created}): uploaded by a '${event}' run."
    continue
    ;;
  esac

  gh api "repos/${GITHUB_REPOSITORY}/actions/artifacts/${id}/zip" >"$tmp/state.zip"
  # Naming the member means nothing else in the zip is written anywhere, and
  # a zip without it fails here.
  unzip -q -o "$tmp/state.zip" terraform.tfstate -d "$tmp"
  if ! jq -e '(.version | type == "number") and (.resources | type == "array")' \
    "$tmp/terraform.tfstate" >/dev/null; then
    echo "::error::tofu-state artifact ${id} does not hold an OpenTofu state."
    exit 1
  fi

  mkdir -p "$dest"
  mv "$tmp/terraform.tfstate" "$dest/terraform.tfstate"
  echo "found=true" >>"$output"
  echo "Restored state from artifact ${id} (${created}), made by ${path} on ${event}."
  exit 0
done <"$tmp/candidates"

echo "found=false" >>"$output"
