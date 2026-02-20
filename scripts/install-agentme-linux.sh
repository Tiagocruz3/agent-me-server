#!/usr/bin/env bash
set -euo pipefail

# Agent Me Linux one-shot installer/updater (repo-based)
# - Clones/updates repo
# - Installs deps/builds
# - Writes secure default config (token + trustedProxies)
# - Installs/starts systemd user service

REPO_URL="${AGENTME_REPO_URL:-https://github.com/Tiagocruz3/agent-me-server.git}"
REPO_DIR="${AGENTME_REPO_DIR:-$HOME/agent-me-server}"
REF="${AGENTME_REF:-main}"
PORT="${AGENTME_PORT:-18789}"
UPDATE_ONLY="0"
NO_SERVICE="0"
FORCE_CONFIG="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --update) UPDATE_ONLY="1" ;;
    --ref) REF="${2:-}"; shift ;;
    --port) PORT="${2:-}"; shift ;;
    --no-service) NO_SERVICE="1" ;;
    --force-config) FORCE_CONFIG="1" ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
  shift
done

mkdir -p "$HOME/.agentme"
LOG_FILE="$HOME/.agentme/install-linux.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[agentme-install] Starting Linux install/update"

have_cmd() { command -v "$1" >/dev/null 2>&1; }

ensure_base_deps() {
  if have_cmd apt-get; then
    if have_cmd curl && have_cmd git && have_cmd make && (have_cmd gcc || have_cmd cc); then
      echo "[agentme-install] Base deps already present; skipping apt install"
      return
    fi
    echo "[agentme-install] Ensuring curl/git/build deps"
    sudo apt-get update -y
    sudo apt-get install -y curl git ca-certificates build-essential
  elif have_cmd dnf; then
    echo "[agentme-install] Ensuring curl/git/build deps"
    sudo dnf install -y curl git ca-certificates gcc-c++ make
  elif have_cmd pacman; then
    echo "[agentme-install] Ensuring curl/git/build deps"
    sudo pacman -Sy --noconfirm curl git base-devel
  else
    echo "[agentme-install] Unsupported package manager. Install curl+git+build tools manually." >&2
    exit 1
  fi
}

ensure_node22() {
  if have_cmd node; then
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  else
    NODE_MAJOR="0"
  fi

  if [[ "$NODE_MAJOR" -ge 22 ]]; then
    echo "[agentme-install] Node $(node -v) OK"
    return
  fi

  echo "[agentme-install] Installing Node 22.x"
  if have_cmd apt-get; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif have_cmd dnf; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs
  else
    echo "[agentme-install] Please install Node 22+ manually for this distro." >&2
    exit 1
  fi
}

ensure_pnpm() {
  if ! have_cmd pnpm; then
    echo "[agentme-install] Installing pnpm@10"
    npm install -g pnpm@10
  fi
}

fetch_repo() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    echo "[agentme-install] Updating repo: $REPO_DIR"
    git -C "$REPO_DIR" fetch --all --prune
  else
    if [[ "$UPDATE_ONLY" == "1" ]]; then
      echo "[agentme-install] --update specified but repo missing at $REPO_DIR" >&2
      exit 1
    fi
    echo "[agentme-install] Cloning repo: $REPO_URL"
    git clone "$REPO_URL" "$REPO_DIR"
  fi

  if [[ "$REF" == "main" ]]; then
    git -C "$REPO_DIR" checkout main
    git -C "$REPO_DIR" pull --ff-only
  else
    git -C "$REPO_DIR" checkout "$REF"
  fi
}

build_app() {
  cd "$REPO_DIR"
  echo "[agentme-install] Installing dependencies"
  pnpm install --frozen-lockfile || pnpm install
  echo "[agentme-install] Building app"
  pnpm build
  pnpm ui:build
}

ensure_wrapper() {
  mkdir -p "$HOME/.local/bin"
  cat > "$HOME/.local/bin/agentme" <<'EOF'
#!/usr/bin/env bash
node "$HOME/agent-me-server/agentme.mjs" "$@"
EOF
  chmod +x "$HOME/.local/bin/agentme"

  if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.bashrc" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  fi
  export PATH="$HOME/.local/bin:$PATH"
  hash -r || true
}

write_config() {
  local cfg="$HOME/.agentme/agentme.json"
  if [[ -f "$cfg" && "$FORCE_CONFIG" != "1" ]]; then
    if node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'));" "$cfg" >/dev/null 2>&1; then
      echo "[agentme-install] Config exists and is valid, leaving in place: $cfg"
      return
    fi
    echo "[agentme-install] Existing config is invalid JSON; rewriting: $cfg"
  fi

  local token
  token="$(openssl rand -hex 32)"
  cat > "$cfg" <<EOF
{
  "gateway": {
    "mode": "local",
    "port": $PORT,
    "bind": "loopback"
    "auth": { "token": "$token" },
    "trustedProxies": ["127.0.0.1", "::1", "localhost"],
    "controlUi": { "root": "$REPO_DIR/dist/control-ui" }
  }
}
EOF
  chmod 600 "$cfg"
  echo "[agentme-install] Wrote fresh config: $cfg"
}

install_service() {
  if [[ "$NO_SERVICE" == "1" ]]; then
    echo "[agentme-install] Skipping service install (--no-service)"
    return
  fi

  echo "[agentme-install] Installing systemd user service"
  agentme gateway install --force || node "$REPO_DIR/agentme.mjs" gateway install --force

  systemctl --user daemon-reload || true
  systemctl --user enable --now agentme-gateway || true
}

post_checks() {
  if [[ "$NO_SERVICE" == "1" ]]; then
    echo "[agentme-install] --no-service selected; skipping gateway probe"
    echo "[agentme-install] Start manually: agentme gateway"
    return
  fi

  echo "[agentme-install] Probing gateway"
  if ! agentme gateway probe; then
    echo "[agentme-install] Gateway probe failed" >&2
    echo "[agentme-install] Check logs: journalctl --user -u agentme-gateway -n 120 --no-pager" >&2
    exit 1
  fi

  echo "[agentme-install] Final status"
  agentme status || true
}

ensure_base_deps
ensure_node22
ensure_pnpm
fetch_repo
build_app
ensure_wrapper
write_config
install_service
post_checks

echo "[agentme-install] Done. Log: $LOG_FILE"
