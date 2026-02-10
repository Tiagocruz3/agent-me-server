---
summary: "CLI reference for `agentme config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `agentme config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `agentme configure`).

## Examples

```bash
agentme config get browser.executablePath
agentme config set browser.executablePath "/usr/bin/google-chrome"
agentme config set agents.defaults.heartbeat.every "2h"
agentme config set agents.list[0].tools.exec.node "node-id-or-name"
agentme config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
agentme config get agents.defaults.workspace
agentme config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
agentme config get agents.list
agentme config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
agentme config set agents.defaults.heartbeat.every "0m"
agentme config set gateway.port 19001 --json
agentme config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.
