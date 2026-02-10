---
summary: "CLI reference for `agentme agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `agentme agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
agentme agents list
agentme agents add work --workspace ~/.agentme/workspace-work
agentme agents set-identity --workspace ~/.agentme/workspace --from-identity
agentme agents set-identity --agent main --avatar avatars/agentme.png
agentme agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.agentme/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
agentme agents set-identity --workspace ~/.agentme/workspace --from-identity
```

Override fields explicitly:

```bash
agentme agents set-identity --agent main --name "AgentMe" --emoji "🦞" --avatar avatars/agentme.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "AgentMe",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/agentme.png",
        },
      },
    ],
  },
}
```
