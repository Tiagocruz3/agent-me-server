---
summary: "Install AgentMe in one command — macOS, Linux, WSL2, and Raspberry Pi"
title: "Install"
---

# Install AgentMe

## One-line install (macOS / Linux / WSL2)

```bash
curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install.sh | bash
```

That’s it. The script handles Node, dependencies, build, and background service automatically.

<Note>
On Windows, run this inside [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install).
</Note>

## One-line install (Raspberry Pi)

```bash
curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install-agentme-pi.sh | bash
```

## What the installer does

1. **Checks your system** — installs Node 22+, Git, and build tools if missing.
2. **Clones the repo** to `~/agent-me-server` (or updates it if already present).
3. **Builds the app** — installs dependencies and compiles the UI.
4. **Installs the `agentme` command** — adds a wrapper to `~/.local/bin` and updates your PATH.
5. **Writes a safe default config** — loopback-only, with a fresh auth token.
6. **Starts the background service** — systemd on Linux, LaunchAgent on macOS.
7. **Probes the gateway** — confirms everything is healthy.

## Installer options

```bash
curl -fsSL https://raw.githubusercontent.com/agentme/agentme/main/scripts/install.sh | bash -s -- --help
```

| Flag             | Description                                   |
| ---------------- | --------------------------------------------- |
| `-u`, `--update` | Update an existing install                    |
| `--no-service`   | Skip the background service install           |
| `--force-config` | Overwrite existing config with fresh defaults |
| `--port <port>`  | Gateway port (default: `18789`)               |
| `--ref <ref>`    | Git ref to checkout (default: `main`)         |

## Other install methods

<CardGroup cols={2}>
  <Card title="npm / pnpm" href="/install/node" icon="package">
    If you already have Node 22+ and prefer to manage the install yourself.
  </Card>
  <Card title="Docker" href="/install/docker" icon="container">
    Containerized or headless deployments.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Declarative install via Nix.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Automated fleet provisioning.
  </Card>
</CardGroup>

## After install

```bash
agentme dashboard   # Open the web UI
agentme status      # Check gateway health
agentme doctor      # Diagnose issues
agentme onboard     # Run the setup wizard
```

## Troubleshooting

### `agentme: command not found`

If the install succeeded but `agentme` isn't found in a new terminal, your shell may need its PATH refreshed:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Then add that line to your shell startup file (`~/.zshrc` or `~/.bashrc`) to make it permanent.

### Need more help?

- [Node.js setup & PATH fixes](/install/node)
- [Updating AgentMe](/install/updating)
- [Uninstalling](/install/uninstall)
