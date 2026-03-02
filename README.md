# AgentMe Server

<p align="center">
  <img src="docs/assets/agentme-logo-text.png" alt="AgentMe" width="400">
</p>

<p align="center">
  <strong>Multi-channel AI gateway with extensible messaging integrations</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2026.2.9-blue.svg?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg?style=for-the-badge" alt="Node.js">
</p>

---

**AgentMe** is a personal AI assistant platform you run on your own devices. It answers you on the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat), plus extension channels like BlueBubbles, Matrix, Zalo, and more.

If you want a personal, single-user assistant that feels local, fast, and always-on, this is it.

---

## Features

- **Multi-Agent Management** — Deploy and manage multiple AI agents from a unified dashboard
- **Channel Integrations** — Connect WhatsApp, Telegram, WebChat, Slack, Discord, and more
- **Skills & Tools** — Extensible skill system with sandboxed tool execution
- **Cron & Automation** — Schedule automated tasks with cron expressions
- **Memory & Context** — Persistent memory storage per agent with session management
- **Usage Analytics** — Token usage tracking, cost monitoring, and session analytics

---

## Installation

### Prerequisites

- **Node.js** ≥ 22
- **npm**, **pnpm**, or **bun**

### Quick Install

```bash
npm install -g agentme@latest

agentme onboard --install-daemon
```

The wizard installs the Gateway daemon (launchd/systemd user service) so it stays running.

### From Source

```bash
git clone https://github.com/Agentme-AI/Server.git
cd Server

pnpm install
pnpm ui:build
pnpm build

pnpm agentme onboard --install-daemon
```

---

## Quick Start

```bash
# Start the gateway
agentme gateway --port 18789 --verbose

# Send a message
agentme message send --to +1234567890 --message "Hello from AgentMe"

# Talk to the assistant
agentme agent --message "Ship checklist" --thinking high
```

The web interface is available at `http://localhost:18789`

---

## Configuration

1. Run the onboarding wizard: `agentme onboard`
2. Configure environment variables in `.env`
3. Set up channels (WhatsApp, Telegram, etc.)
4. Configure AI model providers

---

## Documentation

- [Getting Started](docs/start/getting-started.md)
- [Installation](docs/install/)
- [Configuration](docs/gateway/configuration.md)
- [Channels](docs/channels/)
- [Tools](docs/tools/)

---

## Development

```bash
# Install dependencies
pnpm install

# Build UI
pnpm ui:build

# Build server
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Made with ❤️ by the AgentMe Team</strong>
</p>
