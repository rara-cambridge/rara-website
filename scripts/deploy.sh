#!/usr/bin/env bash

# Commit the current build, and optionally push it to a remote branch

set -euo pipefail

#------------------------------------------------------------------------------
# Parse arguments
#------------------------------------------------------------------------------

usage() {
    echo "Usage: $0 <remote> <branch> [--push]"
    echo
    echo "  remote   The remote name (e.g. origin)"
    echo "  branch   The branch name (e.g. main)"
    echo "  --push   Optional flag; if provided, the script will push"
    exit 1
}

push=

# Need at least 2 args
if [[ $# -lt 2 ]]; then
    echo "Error: remote and branch are required."
    usage
fi

remote="$1"
target_branch="$2"
shift 2

# Process optional flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --push)
            push=true
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            ;;
        *)
            echo "Unexpected argument: $1"
            usage
            ;;
    esac
done

#------------------------------------------------------------------------------
# Script logic
#------------------------------------------------------------------------------

# Get source commit
source_commit=$(git rev-parse HEAD)
if [[ -n "$(git status --porcelain)" ]]; then
  commit="${source_commit}-dirty"
fi

# Get source branch
source_branch=$(git rev-parse --abbrev-ref HEAD)
source_pwd=$(pwd)

# Set git user details
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Switch to a temporary branch
temp_branch=__deploy-${source_commit}
git branch -D ${temp_branch} &>/dev/null || true
git checkout -b ${temp_branch}

# Change working directory to root of repo
cd $(git rev-parse --show-toplevel)

# Fetch from remote
git fetch ${remote}
git reset ${remote}/${target_branch}

# Store source commit in build directory for each theme and plugin
for dir in themes/rara plugins/rara-maps; do
  mkdir -p ${dir}/build
  rm -f ${dir}/build/commit
  cat << EOF > ${dir}/build/build.json
{
  "commit": "${source_commit}"
}
EOF
done

# Make sure build directories are not ignored
( sed -i.bak '/^build$/d' .gitignore || true ) && rm -f .gitignore.bak

# Commit the changes
git add -A
git commit --no-verify -m "Deploy build from ${source_commit} [skip ci]" || echo "No changes to commit"

# Push to remote, if the flag was set
[[ -z "${push}" ]] || git push ${remote} HEAD:${target_branch}

# Return to original branch and directory
git checkout ${source_branch}
cd ${source_pwd}

# Remove temporary branch if it has been pushed to the remote
if [[ -z "${push}" ]]; then
  echo "Commit saved in branch ${temp_branch}"
else
  git branch -D ${temp_branch}
fi
