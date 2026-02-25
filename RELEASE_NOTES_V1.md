# Agent Me v1 Release Notes

## Highlights

- Premium control UI refresh across dashboard, navigation, chat polish, and scheduler.
- Google-style scheduler interactions with single-click select + double-click modal behavior.
- Agent Dashboard improvements: cleaner cards, avatar deep-link to Manage Agent, focused overview.
- Branding refresh with custom logo in topbar and improved login card treatment.
- In-app **Backup Server** JSON export and **Restore Server** import/apply page.

## v1 Checklist Status

- ✅ Core UI flows: chat/dashboard/scheduler/nav interactions stabilized.
- ✅ Build + lint gate: `pnpm lint`, `pnpm build`, `pnpm ui:build` pass.
- ✅ Backup/Restore UI flow: export + restore import page with preview and apply path.
- ✅ Label cleanup pass completed (including Scheduler naming).

## Backup/Restore Behavior

- Backup exports a portable JSON payload from control UI.
- Restore validates file parse, shows preview summary, and applies config via gateway `config.apply`.
- Safety note shown in UI: keep a known-good backup for fast rollback.

## Known Constraints

- Restore currently targets config payload restoration (not full workspace file replay).
- Large JS chunk warning remains during UI build (non-blocking for release).

## Recommended Post-v1

1. Add restore rollback automation (one-click previous snapshot restore).
2. Add richer restore validation (schema diff + dry-run mode).
3. Expand backup package to optional full workspace archive mode.
