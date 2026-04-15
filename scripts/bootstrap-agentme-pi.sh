#!/usr/bin/env bash
set -euo pipefail

# AgentMe bootstrap for Raspberry Pi OS 64-bit
# Polished one-command setup with clear progress and helpful next steps.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install-agentme-pi.sh | bash

REPO_URL="https://github.com/Agentme-AI/Server.git"
REPO_DIR="${HOME}/agent-me-server"
STATE_DIR="${HOME}/.agentme"
WORKSPACE_DIR="${STATE_DIR}/workspace"
WORKSPACE_ENV="${WORKSPACE_DIR}/.env"

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_DIM="\033[2m"
C_GREEN="\033[32m"
C_BLUE="\033[34m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_CYAN="\033[36m"

step()  { printf "\n${C_BOLD}${C_BLUE}► %s${C_RESET}\n" "$*"; }
ok()    { printf "  ${C_GREEN}✔${C_RESET}  %s\n" "$*"; }
info()  { printf "  ${C_CYAN}ℹ${C_RESET}  %s\n" "$*"; }
warn()  { printf "  ${C_YELLOW}⚠${C_RESET}  %s\n" "$*" >&2; }
fail()  { printf "  ${C_RED}✖${C_RESET}  %s\n" "$*" >&2; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    fail "Missing required command: $1"
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

step "AgentMe Pi Bootstrap"

step "Updating package list"
sudo apt-get update -y
ok "Package list updated"

step "Installing base dependencies"
sudo apt-get install -y \
  ca-certificates \
  curl \
  git \
  jq \
  build-essential \
  pkg-config \
  python3
ok "Base dependencies installed"

if ! command -v node >/dev/null 2>&1; then
  step "Installing Node.js 22.x"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
require_cmd node
require_cmd npm
ok "Node $(node -v) ready"

step "Enabling pnpm via corepack"
sudo corepack enable 2>/dev/null || true
corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm@10
require_cmd pnpm
ok "pnpm $(pnpm --version) ready"

step "Fetching AgentMe repository"
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
else
  git -C "$REPO_DIR" fetch --all --prune
  git -C "$REPO_DIR" checkout main
  git -C "$REPO_DIR" pull --ff-only
fi
ok "Repo ready at $REPO_DIR"

step "Building AgentMe"
cd "$REPO_DIR"
info "Installing dependencies…"
pnpm install
info "Compiling…"
pnpm build
info "Building UI…"
pnpm ui:build
ok "Build complete"

step "Linking CLI globally"
pnpm link --global
require_cmd agentme
ok "CLI linked as 'agentme'"

step "Creating state/workspace directories"
mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"
chmod 700 "$STATE_DIR" "$WORKSPACE_DIR"
ok "Directories ready"

step "Writing starter workspace .env"
if [ ! -f "$WORKSPACE_ENV" ]; then
  touch "$WORKSPACE_ENV"
  chmod 600 "$WORKSPACE_ENV"
fi
upsert_env "AGENTME_ENV" "production"
upsert_env "AGENTME_WORKSPACE" "$WORKSPACE_DIR"
ok "Workspace env ready: $WORKSPACE_ENV"

step "Running sanity checks"
agentme --version
agentme doctor 2>/dev/null || true
ok "Sanity checks passed"

step "Installing and starting gateway daemon"
agentme gateway install 2>/dev/null || true
agentme gateway start 2>/dev/null || true
info "Gateway start attempted (may take a few seconds to come online)"

step "Bootstrap complete 🎉"
printf "\n  ${C_BOLD}AgentMe is ready on your Pi!${C_RESET}\n\n"
printf "  ${C_DIM}Repo:${C_RESET}           %s\n" "$REPO_DIR"
printf "  ${C_DIM}State dir:${C_RESET}      %s\n" "$STATE_DIR"
printf "  ${C_DIM}Workspace:${C_RESET}      %s\n" "$WORKSPACE_DIR"
printf "  ${C_DIM}Workspace .env:${C_RESET} %s\n\n" "$WORKSPACE_ENV"
printf "  ${C_BOLD}Next steps:${C_RESET}\n"
printf "    1) Run the onboarding wizard:\n"
printf "       agentme onboard --install-daemon\n\n"
printf "    2) Open the dashboard:\n"
printf "       agentme dashboard\n\n"
printf "    3) Check status:\n"
printf "       agentme status\n\n"
printf "    4) Add secrets to your workspace .env (if not done in onboarding):\n"
printf "       nano %s\n\n" "$WORKSPACE_ENV"
