---
summary: "CLI reference for `agentme logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `agentme logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
agentme logs
agentme logs --follow
agentme logs --json
agentme logs --limit 500
```
