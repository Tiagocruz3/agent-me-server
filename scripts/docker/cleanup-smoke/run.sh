#!/usr/bin/env bash
set -euo pipefail

cd /repo

export AGENTME_STATE_DIR="/tmp/agentme-test"
export AGENTME_CONFIG_PATH="${AGENTME_STATE_DIR}/agentme.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${AGENTME_STATE_DIR}/credentials"
mkdir -p "${AGENTME_STATE_DIR}/agents/main/sessions"
echo '{}' >"${AGENTME_CONFIG_PATH}"
echo 'creds' >"${AGENTME_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${AGENTME_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm agentme reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${AGENTME_CONFIG_PATH}"
test ! -d "${AGENTME_STATE_DIR}/credentials"
test ! -d "${AGENTME_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${AGENTME_STATE_DIR}/credentials"
echo '{}' >"${AGENTME_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm agentme uninstall --state --yes --non-interactive

test ! -d "${AGENTME_STATE_DIR}"

echo "OK"
