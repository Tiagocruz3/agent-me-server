---
summary: "CLI reference for `agentme reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `agentme reset`

Reset local config/state (keeps the CLI installed).

```bash
agentme reset
agentme reset --dry-run
agentme reset --scope config+creds+sessions --yes --non-interactive
```
