#!/usr/bin/env bash
set -euo pipefail

# Agent Me Robot bootstrap for fresh Raspberry Pi OS 64-bit
# Repo: https://github.com/Tiagocruz3/agent-me-server
#
# Usage:
#   chmod +x bootstrap-agentme-pi.sh
#   ./bootstrap-agentme-pi.sh

REPO_URL="https://github.com/Tiagocruz3/agent-me-server.git"
REPO_DIR="${HOME}/agent-me-server"
STATE_DIR="${HOME}/.agentme"
WORKSPACE_DIR="${STATE_DIR}/workspace"
WORKSPACE_ENV="${WORKSPACE_DIR}/.env"

log() {
  printf "\n[agentme-bootstrap] %s\n" "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

upsert_env() {
  local key="$1"
  local value="$2"
  mkdir -p "$(dirname "$WORKSPACE_ENV")"
  touch "$WORKSPACE_ENV"
  chmod 600 "$WORKSPACE_ENV"

  if grep -qE "^${key}=" "$WORKSPACE_ENV"; then
    sed -i.bak "s#^${key}=.*#${key}=${value}#" "$WORKSPACE_ENV"
    rm -f "${WORKSPACE_ENV}.bak"
  else
    printf "%s=%s\n" "$key" "$value" >> "$WORKSPACE_ENV"
  fi
}

log "Updating apt cache"
sudo apt-get update -y

log "Installing base dependencies"
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  jq \
  build-essential \
  pkg-config \
  python3

if ! command -v node >/dev/null 2>&1; then
  log "Installing Node.js 22.x"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

require_cmd node
require_cmd npm

log "Enabling corepack (pnpm)"
sudo corepack enable || true
corepack prepare pnpm@latest --activate
require_cmd pnpm

if [ ! -d "$REPO_DIR/.git" ]; then
  log "Cloning Agent Me Server repo"
  git clone "$REPO_URL" "$REPO_DIR"
else
  log "Repo already present; pulling latest"
  git -C "$REPO_DIR" fetch --all --prune
  git -C "$REPO_DIR" checkout main
  git -C "$REPO_DIR" pull --ff-only
fi

log "Installing dependencies"
pnpm -C "$REPO_DIR" install

log "Building project"
pnpm -C "$REPO_DIR" build

log "Linking local CLI (agentme) from cloned repo"
pnpm -C "$REPO_DIR" link --global

require_cmd agentme

log "Creating state/workspace directories"
mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"
chmod 700 "$STATE_DIR" "$WORKSPACE_DIR"

log "Writing starter workspace .env"
if [ ! -f "$WORKSPACE_ENV" ]; then
  touch "$WORKSPACE_ENV"
  chmod 600 "$WORKSPACE_ENV"
fi
upsert_env "AGENTME_ENV" "production"
upsert_env "AGENTME_WORKSPACE" "$WORKSPACE_DIR"

log "Running non-interactive sanity checks"
agentme --version
agentme doctor || true

log "Installing and starting gateway daemon"
agentme gateway install || true
agentme gateway start || true

cat <<EOF

✅ Agent Me Robot bootstrap complete.

Repo:           $REPO_DIR
State dir:      $STATE_DIR
Workspace:      $WORKSPACE_DIR
Workspace .env: $WORKSPACE_ENV

Next steps:
1) Open onboarding wizard:
   agentme onboard --install-daemon

2) Or open dashboard:
   agentme dashboard --no-open

3) Add your secrets to workspace .env (if not done in GUI onboarding):
   $WORKSPACE_ENV

EOF
