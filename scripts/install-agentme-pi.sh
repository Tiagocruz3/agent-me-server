#!/usr/bin/env bash
set -euo pipefail

# AgentMe Pi installer — clones/updates the repo, then runs the Pi bootstrap.
# Works on Raspberry Pi OS 64-bit and other Debian-based ARM systems.
#
# Quick start:
#   curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install-agentme-pi.sh | bash

REPO_URL="https://github.com/Agentme-AI/Server.git"
REPO_DIR="${HOME}/agent-me-server"
BOOTSTRAP_REL="scripts/bootstrap-agentme-pi.sh"

C_BOLD="\033[1m"
C_BLUE="\033[34m"
C_GREEN="\033[32m"
C_RESET="\033[0m"

info()  { printf "${C_BLUE}ℹ${C_RESET}  %s\n" "$*"; }
ok()    { printf "${C_GREEN}✔${C_RESET}  %s\n" "$*"; }

info "Preparing AgentMe repository…"

if ! command -v git >/dev/null 2>&1; then
  info "Installing git…"
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
ok "Repo ready. Handing off to Pi bootstrap…"
exec "${REPO_DIR}/${BOOTSTRAP_REL}"
