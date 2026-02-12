# AgentMe Fork Plan (Rebrand + Security + Clone Pipeline)

## Goal

Create a branded AgentMe fork with stronger security defaults and a repeatable clone/deploy process where secrets are entered on first boot (never baked into images).

---

## Phase 0 — Repo Setup (Today)

- [x] Clone upstream repo to Desktop (`~/Desktop/agentme`)
- [ ] Create your fork on GitHub
- [ ] Set git remotes:
  - `origin` -> your fork
  - `upstream` -> `https://github.com/agentme/agentme`
- [ ] Create working branches:
  - `brand/ui`
  - `security/baseline`
  - `bootstrap/first-boot`

---

## Phase 1 — Rebrand Foundation

- [ ] Rename product strings (app name, labels, docs header)
- [ ] Replace logo/icons/theme palette
- [ ] Add custom default persona files/templates
- [ ] Add build/version badge in UI for fork identification

Deliverable: visually rebranded build that still runs upstream features.

---

## Phase 2 — Security Baseline (High Priority)

- [ ] Enforce no-secrets-in-repo policy
  - `.env.example` placeholders only
  - pre-commit secret scanning
- [ ] Secure config permissions at runtime (`chmod 600`)
- [ ] Owner allowlist default on messaging channels
- [ ] Tool policy gates for destructive actions
- [ ] Default local bind + trusted proxy docs/config
- [ ] Redacted audit logs for tool calls and config changes

Deliverable: hardened default posture for all new installs.

---

## Phase 3 — First-Boot Setup (Clone-safe)

- [ ] Add first-boot wizard script
  - asks owner name/ID, Telegram token, OpenAI key, optional providers
- [ ] Block full runtime until required secrets are entered
- [ ] Write secrets only on target machine
- [ ] Delete/disable bootstrap prompt after successful setup

Deliverable: fresh machine can be provisioned safely without key leakage.

---

## Phase 4 — Clone/Deploy Kit

- [ ] Create template backup package (no secrets)
- [ ] Restore script for fresh host (Pi, Mac, VPS)
- [ ] One-command installer for dependencies + service setup
- [ ] Post-install validation checks (gateway, channels, tool health)

Deliverable: repeatable "spin-up a clone" workflow.

---

## Phase 5 — Production Readiness

- [ ] Regression tests for key flows (chat/audio/image/browser/exec)
- [ ] Rate-limit + timeout checks
- [ ] Security audit checklist pass
- [ ] Release notes + version tag

Deliverable: stable and marketable fork release.

---

## Immediate Next 3 Actions

1. Create GitHub fork and connect remotes.
2. Implement first security PR (`security/baseline`): secret scan + secure file perms + allowlist defaults.
3. Implement first-boot wizard skeleton (`bootstrap/first-boot`).
