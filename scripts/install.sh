#!/usr/bin/env bash
set -euo pipefail

# AgentMe One-Shot Installer
# macOS • Linux • WSL2
# One command to install, build, and run AgentMe from source.
#
# Quick start:
#   curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install.sh | bash
#
# Update existing install:
#   curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install.sh | bash -s -- --update

REPO_URL="${AGENTME_REPO_URL:-https://github.com/Agentme-AI/Server.git}"
REPO_DIR="${AGENTME_REPO_DIR:-$HOME/agent-me-server}"
REF="${AGENTME_REF:-main}"
PORT="${AGENTME_PORT:-18789}"
UPDATE_ONLY="0"
NO_SERVICE="0"
NO_AUDIT_FIX="0"
FORCE_CONFIG="0"

# Colors
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

usage() {
  cat <<EOF
AgentMe Installer — One command to install, build, and run.

Usage:
  curl -fsSL .../install.sh | bash
  curl -fsSL .../install.sh | bash -s -- [OPTIONS]

Options:
  -u, --update        Update an existing install (fail if repo is missing)
  --ref <ref>         Git ref to checkout (default: main)
  --port <port>       Gateway port (default: 18789)
  --no-service        Skip systemd / launchd service install
  --no-audit-fix      Skip security audit fix (macOS only)
  --force-config      Overwrite existing config with fresh defaults
  --repo-dir <dir>    Clone directory (default: ~/agent-me-server)
  --repo-url <url>    Git URL to clone
  -h, --help          Show this help

Environment variables:
  AGENTME_REPO_URL    Same as --repo-url
  AGENTME_REPO_DIR    Same as --repo-dir
  AGENTME_REF         Same as --ref
  AGENTME_PORT        Same as --port
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--update) UPDATE_ONLY="1"; shift ;;
    --ref) REF="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --no-service) NO_SERVICE="1"; shift ;;
    --no-audit-fix) NO_AUDIT_FIX="1"; shift ;;
    --force-config) FORCE_CONFIG="1"; shift ;;
    --repo-dir) REPO_DIR="${2:-}"; shift 2 ;;
    --repo-url) REPO_URL="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Unknown option: $1"; usage; exit 1 ;;
  esac
done

OS=""
case "$(uname -s)" in
  Darwin) OS="macos" ;;
  Linux)  OS="linux" ;;
  *) fail "Unsupported OS: $(uname -s). Use macOS or Linux (including WSL2)."; exit 1 ;;
esac

mkdir -p "$HOME/.agentme"
LOG_FILE="$HOME/.agentme/install.log"
exec > >(tee -a "$LOG_FILE") 2>&1

step "AgentMe Installer"
info "OS: $OS • Log: $LOG_FILE • Target: $REPO_DIR"

have_cmd() { command -v "$1" >/dev/null 2>&1; }

# ── Shell RC detection ───────────────────────────────────────────────────────
detect_shell_rc() {
  local shell_name="${SHELL:-}"
  local rc=""
  if [[ "$shell_name" == *"zsh" ]]; then
    rc="$HOME/.zshrc"
  elif [[ "$shell_name" == *"bash" ]]; then
    rc="$HOME/.bashrc"
  elif [[ -f "$HOME/.zshrc" ]]; then
    rc="$HOME/.zshrc"
  elif [[ -f "$HOME/.bashrc" ]]; then
    rc="$HOME/.bashrc"
  else
    rc="$HOME/.profile"
  fi
  printf '%s' "$rc"
}

SHELL_RC="$(detect_shell_rc)"

# ── macOS: Homebrew ──────────────────────────────────────────────────────────
auth_brew_env() {
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
  fi
}

ensure_brew() {
  auth_brew_env
  if have_cmd brew; then
    ok "Homebrew already installed"
    return
  fi
  step "Installing Homebrew"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  auth_brew_env
  local brew_shellenv=""
  if [[ -x /opt/homebrew/bin/brew ]]; then
    brew_shellenv='eval "$(/opt/homebrew/bin/brew shellenv)"'
  elif [[ -x /usr/local/bin/brew ]]; then
    brew_shellenv='eval "$(/usr/local/bin/brew shellenv)"'
  fi
  if [[ -n "$brew_shellenv" && -f "$HOME/.zprofile" ]]; then
    if ! grep -qF "$brew_shellenv" "$HOME/.zprofile" 2>/dev/null; then
      echo "$brew_shellenv" >> "$HOME/.zprofile"
    fi
  elif [[ -n "$brew_shellenv" && -f "$SHELL_RC" ]]; then
    if ! grep -qF "$brew_shellenv" "$SHELL_RC" 2>/dev/null; then
      echo "$brew_shellenv" >> "$SHELL_RC"
    fi
  fi
  ok "Homebrew installed"
}

# ── Base deps ────────────────────────────────────────────────────────────────
ensure_base_deps() {
  step "Checking system dependencies"
  if [[ "$OS" == "macos" ]]; then
    ensure_brew
    if ! have_cmd git; then
      step "Installing Git"
      brew install git
    fi
    ok "Git ready"
    return
  fi

  # Linux
  if have_cmd apt-get; then
    if have_cmd curl && have_cmd git && have_cmd make && (have_cmd gcc || have_cmd cc); then
      ok "All base deps present"
      return
    fi
    step "Installing curl, git, and build tools"
    sudo apt-get update -y
    sudo apt-get install -y curl git ca-certificates build-essential
  elif have_cmd dnf; then
    if have_cmd curl && have_cmd git && have_cmd make && (have_cmd gcc || have_cmd cc); then
      ok "All base deps present"
      return
    fi
    step "Installing curl, git, and build tools"
    sudo dnf install -y curl git ca-certificates gcc-c++ make
  elif have_cmd pacman; then
    if have_cmd curl && have_cmd git && have_cmd make && (have_cmd gcc || have_cmd cc); then
      ok "All base deps present"
      return
    fi
    step "Installing curl, git, and build tools"
    sudo pacman -Sy --noconfirm curl git base-devel
  else
    fail "Unsupported package manager. Install curl, git, and build tools manually."
    exit 1
  fi
  ok "Base deps installed"
}

# ── Node 22+ ─────────────────────────────────────────────────────────────────
ensure_node22() {
  step "Checking Node.js"
  local node_major="0"
  if have_cmd node; then
    node_major="$(node -p 'process.versions.node.split(".")[0]')"
  fi

  if [[ "$node_major" -ge 22 ]]; then
    ok "Node $(node -v)"
    return
  fi

  step "Installing Node.js 22+"
  if [[ "$OS" == "macos" ]]; then
    brew install node
  elif have_cmd apt-get; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif have_cmd dnf; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    sudo dnf install -y nodejs
  else
    fail "Please install Node 22+ manually for this distro."
    exit 1
  fi
  ok "Node $(node -v) installed"
}

# ── pnpm ─────────────────────────────────────────────────────────────────────
ensure_pnpm() {
  step "Checking pnpm"
  if have_cmd pnpm; then
    ok "pnpm $(pnpm --version)"
    return
  fi
  step "Installing pnpm"
  npm install -g pnpm@10
  ok "pnpm installed"
}

# ── Repo ─────────────────────────────────────────────────────────────────────
fetch_repo() {
  step "Fetching AgentMe repository"
  if [[ -d "$REPO_DIR/.git" ]]; then
    info "Updating existing repo: $REPO_DIR"
    git -C "$REPO_DIR" fetch --all --prune
  else
    if [[ "$UPDATE_ONLY" == "1" ]]; then
      fail "--update specified but repo is missing at $REPO_DIR"
      exit 1
    fi
    info "Cloning repo: $REPO_URL"
    git clone "$REPO_URL" "$REPO_DIR"
  fi

  if [[ "$REF" == "main" ]]; then
    git -C "$REPO_DIR" checkout main
    git -C "$REPO_DIR" pull --ff-only
  else
    git -C "$REPO_DIR" checkout "$REF"
  fi
  ok "Repo ready at $REPO_DIR (ref: $(git -C "$REPO_DIR" rev-parse --short HEAD))"
}

# ── Build ────────────────────────────────────────────────────────────────────
build_app() {
  step "Building AgentMe"
  cd "$REPO_DIR"
  info "Installing dependencies…"
  pnpm install --frozen-lockfile || pnpm install
  info "Compiling…"
  pnpm build
  info "Building UI…"
  pnpm ui:build

  if [[ ! -f "$REPO_DIR/dist/control-ui/index.html" ]]; then
    fail "Missing UI artifact: dist/control-ui/index.html"
    exit 1
  fi
  if [[ ! -f "$REPO_DIR/dist/entry.mjs" && ! -f "$REPO_DIR/dist/entry.js" ]]; then
    fail "Missing runtime artifact: dist/entry.(m)js"
    exit 1
  fi
  ok "Build complete"
}

# ── Wrapper ──────────────────────────────────────────────────────────────────
ensure_wrapper() {
  step "Installing agentme CLI wrapper"
  mkdir -p "$HOME/.local/bin"

  local entry="agentme.mjs"
  if [[ ! -f "$REPO_DIR/$entry" ]]; then
    fail "Missing entry script: $REPO_DIR/$entry"
    exit 1
  fi

  cat > "$HOME/.local/bin/agentme" <<EOF
#!/usr/bin/env bash
# AgentMe wrapper — auto-generated by install.sh
exec node "$REPO_DIR/$entry" "\$@"
EOF
  chmod +x "$HOME/.local/bin/agentme"

  local path_line='export PATH="$HOME/.local/bin:$PATH"'
  if [[ -f "$SHELL_RC" ]] && ! grep -qF "$path_line" "$SHELL_RC" 2>/dev/null; then
    echo "$path_line" >> "$SHELL_RC"
    info "Added ~/.local/bin to PATH in $SHELL_RC"
  fi
  export PATH="$HOME/.local/bin:$PATH"
  hash -r 2>/dev/null || true
  ok "Wrapper installed at ~/.local/bin/agentme"
}

# ── Config ───────────────────────────────────────────────────────────────────
write_config() {
  step "Writing default configuration"
  local cfg="$HOME/.agentme/agentme.json"

  if [[ -f "$cfg" && "$FORCE_CONFIG" != "1" ]]; then
    if node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'));" "$cfg" >/dev/null 2>&1; then
      ok "Existing config kept: $cfg"
      return
    fi
    warn "Existing config is invalid JSON; rewriting."
  fi

  local token
  token="$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

  cat > "$cfg" <<EOF
{
  "gateway": {
    "mode": "local",
    "port": $PORT,
    "bind": "loopback",
    "auth": { "mode": "token", "token": "$token" },
    "trustedProxies": ["127.0.0.1", "::1", "localhost"],
    "controlUi": { "root": "$REPO_DIR/dist/control-ui" }
  }
}
EOF
  chmod 600 "$cfg"
  ok "Fresh config written: $cfg"
}

# ── Service ──────────────────────────────────────────────────────────────────
install_service() {
  if [[ "$NO_SERVICE" == "1" ]]; then
    info "Skipping service install (--no-service)"
    return
  fi

  step "Installing background service"
  if [[ "$OS" == "macos" ]]; then
    cd "$REPO_DIR"
    agentme gateway install || node agentme.mjs gateway install
    launchctl bootstrap "gui/$UID" "$HOME/Library/LaunchAgents/ai.agentme.gateway.plist" 2>/dev/null || true
    launchctl kickstart -k "gui/$UID/ai.agentme.gateway" 2>/dev/null || true
  else
    agentme gateway install --force || node "$REPO_DIR/agentme.mjs" gateway install --force
    systemctl --user daemon-reload 2>/dev/null || true
    systemctl --user enable --now agentme-gateway 2>/dev/null || true
  fi
  ok "Service installed"
}

# ── Post-checks ──────────────────────────────────────────────────────────────
post_checks() {
  step "Running post-install checks"
  if [[ "$NO_SERVICE" == "1" ]]; then
    info "Skipping gateway probe (--no-service)"
    return
  fi

  info "Probing gateway…"
  local probe_ok="0"
  for i in {1..12}; do
    if agentme gateway probe 2>/dev/null; then
      probe_ok="1"
      break
    fi
    sleep 1
  done

  if [[ "$probe_ok" != "1" ]]; then
    warn "Gateway probe timed out. It may still be starting up."
    if [[ "$OS" == "macos" ]]; then
      info "Check logs: log show --predicate 'subsystem == \"ai.agentme.gateway\"\"' --last 5m"
    else
      info "Check logs: journalctl --user -u agentme-gateway -n 120 --no-pager"
    fi
  else
    ok "Gateway is responding"
  fi

  if [[ "$OS" == "macos" && "$NO_AUDIT_FIX" != "1" ]]; then
    info "Applying safe security fixes…"
    agentme security audit --fix 2>/dev/null || true
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  ensure_base_deps
  ensure_node22
  ensure_pnpm
  fetch_repo
  build_app
  ensure_wrapper
  write_config
  install_service
  post_checks

  step "Installation complete 🎉"
  printf "\n  ${C_BOLD}AgentMe is ready!${C_RESET}\n\n"
  printf "  ${C_DIM}Repo:${C_RESET}      %s\n" "$REPO_DIR"
  printf "  ${C_DIM}Config:${C_RESET}    ~/.agentme/agentme.json\n"
  printf "  ${C_DIM}Command:${C_RESET}   agentme\n\n"
  printf "  ${C_BOLD}Quick commands:${C_RESET}\n"
  printf "    agentme dashboard       # Open the web UI\n"
  printf "    agentme status          # Check gateway health\n"
  printf "    agentme doctor          # Diagnose issues\n"
  printf "    agentme onboard         # Run the setup wizard\n\n"
  printf "  ${C_DIM}Log file:${C_RESET}  %s\n\n" "$LOG_FILE"
}

main "$@"
