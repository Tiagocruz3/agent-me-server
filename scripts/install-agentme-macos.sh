#!/usr/bin/env bash
set -euo pipefail

# Agent Me macOS one-shot installer/updater (repo-based)

REPO_URL="${AGENTME_REPO_URL:-https://github.com/Tiagocruz3/agent-me-server.git}"
REPO_DIR="${AGENTME_REPO_DIR:-$HOME/agent-me-server}"
REF="${AGENTME_REF:-main}"
PORT="${AGENTME_PORT:-18789}"
UPDATE_ONLY="0"
NO_SERVICE="0"
NO_AUDIT_FIX="0"
FORCE_CONFIG="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --update) UPDATE_ONLY="1" ;;
    --ref) REF="${2:-}"; shift ;;
    --port) PORT="${2:-}"; shift ;;
    --no-service) NO_SERVICE="1" ;;
    --no-audit-fix) NO_AUDIT_FIX="1" ;;
    --force-config) FORCE_CONFIG="1" ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
  shift
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer is macOS-only." >&2
  exit 1
fi

mkdir -p "$HOME/.agentme"
LOG_FILE="$HOME/.agentme/install.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[agentme-install] Starting macOS install/update"

auth_brew_env() {
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

ensure_brew() {
  if ! command -v brew >/dev/null 2>&1; then
    echo "[agentme-install] Installing Homebrew"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  auth_brew_env
  if ! grep -q 'brew shellenv' "$HOME/.zprofile" 2>/dev/null; then
    if [[ -x /opt/homebrew/bin/brew ]]; then
      echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
    else
      echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.zprofile"
    fi
  fi
}

ensure_node_pnpm() {
  if ! command -v node >/dev/null 2>&1; then
    echo "[agentme-install] Installing Node via brew"
    brew install node
  fi
  if ! command -v pnpm >/dev/null 2>&1; then
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

  if [[ ! -f "$REPO_DIR/dist/control-ui/index.html" ]]; then
    echo "[agentme-install] Missing UI artifact: dist/control-ui/index.html" >&2
    exit 1
  fi
  if [[ ! -f "$REPO_DIR/dist/entry.mjs" && ! -f "$REPO_DIR/dist/entry.js" ]]; then
    echo "[agentme-install] Missing runtime artifact: dist/entry.(m)js" >&2
    exit 1
  fi
}

ensure_wrapper() {
  mkdir -p "$HOME/.local/bin"
  cat > "$HOME/.local/bin/agentme" <<'EOF'
#!/usr/bin/env bash
node "$HOME/agent-me-server/agentme.mjs" "$@"
EOF
  chmod +x "$HOME/.local/bin/agentme"

  if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.zprofile" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zprofile"
  fi
  export PATH="$HOME/.local/bin:$PATH"
  hash -r || true
}

write_config() {
  local cfg="$HOME/.agentme/agentme.json"
  if [[ -f "$cfg" && "$FORCE_CONFIG" != "1" ]]; then
    echo "[agentme-install] Config exists, leaving in place: $cfg"
    return
  fi

  local token
  token="$(openssl rand -hex 32)"
  cat > "$cfg" <<EOF
{
  "gateway": {
    "mode": "local",
    "port": $PORT,
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
  cd "$REPO_DIR"
  if [[ "$NO_SERVICE" == "1" ]]; then
    echo "[agentme-install] Skipping service install (--no-service)"
    return
  fi

  echo "[agentme-install] Installing launch agent"
  agentme gateway install || node agentme.mjs gateway install
  launchctl bootstrap "gui/$UID" "$HOME/Library/LaunchAgents/ai.agentme.gateway.plist" 2>/dev/null || true
  launchctl kickstart -k "gui/$UID/ai.agentme.gateway"
}

post_checks() {
  echo "[agentme-install] Probing gateway"
  if ! agentme gateway probe; then
    echo "[agentme-install] Gateway probe failed" >&2
    exit 1
  fi

  if [[ "$NO_AUDIT_FIX" != "1" ]]; then
    echo "[agentme-install] Applying safe security fixes"
    agentme security audit --fix || true
  fi

  echo "[agentme-install] Final status"
  agentme status || true
}

ensure_brew
ensure_node_pnpm
fetch_repo
build_app
ensure_wrapper
write_config
install_service
post_checks

echo "[agentme-install] Done. Log: $LOG_FILE"
