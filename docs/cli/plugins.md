---
summary: "CLI reference for `agentme plugins` (list, install, enable/disable, doctor)"
read_when:
  - You want to install or manage in-process Gateway plugins
  - You want to debug plugin load failures
title: "plugins"
---

# `agentme plugins`

Manage Gateway plugins/extensions (loaded in-process).

Related:

- Plugin system: [Plugins](/tools/plugin)
- Plugin manifest + schema: [Plugin manifest](/plugins/manifest)
- Security hardening: [Security](/gateway/security)

## Commands

```bash
agentme plugins list
agentme plugins info <id>
agentme plugins enable <id>
agentme plugins disable <id>
agentme plugins doctor
agentme plugins update <id>
agentme plugins update --all
```

Bundled plugins ship with AgentMe but start disabled. Use `plugins enable` to
activate them.

All plugins must ship a `agentme.plugin.json` file with an inline JSON Schema
(`configSchema`, even if empty). Missing/invalid manifests or schemas prevent
the plugin from loading and fail config validation.

### Install

```bash
agentme plugins install <path-or-spec>
```

Security note: treat plugin installs like running code. Prefer pinned versions.

Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Use `--link` to avoid copying a local directory (adds to `plugins.load.paths`):

```bash
agentme plugins install -l ./my-plugin
```

### Update

```bash
agentme plugins update <id>
agentme plugins update --all
agentme plugins update <id> --dry-run
```

Updates only apply to plugins installed from npm (tracked in `plugins.installs`).
