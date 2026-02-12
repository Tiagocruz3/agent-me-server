#!/usr/bin/env bash
set -euo pipefail

INSTALL_URL="${AGENTME_INSTALL_URL:-https://agentme.bot/install.sh}"
SMOKE_PREVIOUS_VERSION="${AGENTME_INSTALL_SMOKE_PREVIOUS:-}"
SKIP_PREVIOUS="${AGENTME_INSTALL_SMOKE_SKIP_PREVIOUS:-0}"
DEFAULT_PACKAGE="agentme"
PACKAGE_NAME="${AGENTME_INSTALL_PACKAGE:-$DEFAULT_PACKAGE}"
CLI_NAME="${AGENTME_INSTALL_CLI_NAME:-agentme}"
SKIP_NPM_RESOLVE="${AGENTME_INSTALL_SKIP_NPM_RESOLVE:-0}"

LATEST_VERSION=""
PREVIOUS_VERSION=""

if [[ "$SKIP_NPM_RESOLVE" == "1" ]]; then
  echo "==> Skip npm version resolution (AGENTME_INSTALL_SKIP_NPM_RESOLVE=1)"
else
  echo "==> Resolve npm versions"
  LATEST_VERSION="$(npm view "$PACKAGE_NAME" version)"
  if [[ -n "$SMOKE_PREVIOUS_VERSION" ]]; then
    PREVIOUS_VERSION="$SMOKE_PREVIOUS_VERSION"
  else
    VERSIONS_JSON="$(npm view "$PACKAGE_NAME" versions --json)"
    PREVIOUS_VERSION="$(VERSIONS_JSON="$VERSIONS_JSON" LATEST_VERSION="$LATEST_VERSION" node - <<'NODE'
const raw = process.env.VERSIONS_JSON || "[]";
const latest = process.env.LATEST_VERSION || "";
let versions;
try {
  versions = JSON.parse(raw);
} catch {
  versions = raw ? [raw] : [];
}
if (!Array.isArray(versions)) {
  versions = [versions];
}
if (versions.length === 0) {
  process.exit(1);
}
const latestIndex = latest ? versions.lastIndexOf(latest) : -1;
if (latestIndex > 0) {
  process.stdout.write(String(versions[latestIndex - 1]));
  process.exit(0);
}
process.stdout.write(String(latest || versions[versions.length - 1]));
NODE
)"
  fi
  echo "package=$PACKAGE_NAME latest=$LATEST_VERSION previous=$PREVIOUS_VERSION"
fi

if [[ "$SKIP_PREVIOUS" == "1" || "$SKIP_NPM_RESOLVE" == "1" ]]; then
  echo "==> Skip preinstall previous"
else
  echo "==> Preinstall previous (forces installer upgrade path)"
  npm install -g "${PACKAGE_NAME}@${PREVIOUS_VERSION}"
fi

echo "==> Run official installer one-liner"
curl -fsSL "$INSTALL_URL" | bash

echo "==> Verify installed version"
if ! command -v "$CLI_NAME" >/dev/null 2>&1; then
  echo "ERROR: $CLI_NAME is not on PATH" >&2
  exit 1
fi
if [[ -n "${AGENTME_INSTALL_LATEST_OUT:-}" && -n "$LATEST_VERSION" ]]; then
  printf "%s" "$LATEST_VERSION" > "${AGENTME_INSTALL_LATEST_OUT:-}"
fi
INSTALLED_VERSION="$("$CLI_NAME" --version 2>/dev/null | head -n 1 | tr -d '\r')"
echo "cli=$CLI_NAME installed=$INSTALLED_VERSION expected=${LATEST_VERSION:-n/a}"

if [[ -n "$LATEST_VERSION" && "$INSTALLED_VERSION" != "$LATEST_VERSION" ]]; then
  echo "ERROR: expected ${CLI_NAME}@${LATEST_VERSION}, got ${CLI_NAME}@${INSTALLED_VERSION}" >&2
  exit 1
fi

echo "==> Sanity: CLI runs"
"$CLI_NAME" --help >/dev/null

echo "OK"
