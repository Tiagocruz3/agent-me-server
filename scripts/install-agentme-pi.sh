#!/usr/bin/env bash
set -euo pipefail

# One-command installer for Agent Me Robot on Raspberry Pi OS 64-bit.
# Downloads/updates repo, then runs bootstrap script.

REPO_URL="https://github.com/Tiagocruz3/agent-me-server.git"
REPO_DIR="${HOME}/agent-me-server"
BOOTSTRAP_REL="scripts/bootstrap-agentme-pi.sh"

echo "[agentme-install] Preparing Agent Me Server repo..."

if ! command -v git >/dev/null 2>&1; then
  echo "[agentme-install] Installing git..."
  sudo apt-get update -y
  sudo apt-get install -y git
fi

if [ ! -d "${REPO_DIR}/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
else
  git -C "$REPO_DIR" fetch --all --prune
  git -C "$REPO_DIR" checkout main
  git -C "$REPO_DIR" pull --ff-only
fi

chmod +x "${REPO_DIR}/${BOOTSTRAP_REL}"
exec "${REPO_DIR}/${BOOTSTRAP_REL}"
