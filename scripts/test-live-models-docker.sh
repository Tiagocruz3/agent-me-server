#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${AGENTME_IMAGE:-${CLAWDBOT_IMAGE:-agentme:local}}"
CONFIG_DIR="${AGENTME_CONFIG_DIR:-${CLAWDBOT_CONFIG_DIR:-$HOME/.agentme}}"
WORKSPACE_DIR="${AGENTME_WORKSPACE_DIR:-${CLAWDBOT_WORKSPACE_DIR:-$HOME/.agentme/workspace}}"
PROFILE_FILE="${AGENTME_PROFILE_FILE:-${CLAWDBOT_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e AGENTME_LIVE_TEST=1 \
  -e AGENTME_LIVE_MODELS="${AGENTME_LIVE_MODELS:-${CLAWDBOT_LIVE_MODELS:-all}}" \
  -e AGENTME_LIVE_PROVIDERS="${AGENTME_LIVE_PROVIDERS:-${CLAWDBOT_LIVE_PROVIDERS:-}}" \
  -e AGENTME_LIVE_MODEL_TIMEOUT_MS="${AGENTME_LIVE_MODEL_TIMEOUT_MS:-${CLAWDBOT_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e AGENTME_LIVE_REQUIRE_PROFILE_KEYS="${AGENTME_LIVE_REQUIRE_PROFILE_KEYS:-${CLAWDBOT_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$CONFIG_DIR":/home/node/.agentme \
  -v "$WORKSPACE_DIR":/home/node/.agentme/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
