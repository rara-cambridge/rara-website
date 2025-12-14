#!/usr/bin/env bash

export RARA_WEBSITE=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"/.. &> /dev/null && pwd )

set +x

docker compose --file ${RARA_WEBSITE}/docker/compose.yaml $*
