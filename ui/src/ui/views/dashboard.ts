import { html } from "lit";

export type DashboardProps = {
  connected: boolean;
  agentCount: number;
  sessionsCount: number | null;
  presenceCount: number;
  onOpenTab: (tab: "agents" | "chat" | "cron" | "logs") => void;
};

const starterApps = [
  {
    name: "Realestate Agent",
    role: "Property workflows",
    accent: "#06b6d4",
    icon: "🏠",
  },
  {
    name: "Bird X Agent",
    role: "X/Twitter operations",
    accent: "#3b82f6",
    icon: "🐦",
  },
  {
    name: "EMC2 Core",
    role: "Mission orchestration",
    accent: "#8b5cf6",
    icon: "🤖",
  },
];

export function renderDashboard(props: DashboardProps) {
  return html`
    <section class="grid grid-cols-3" style="margin-bottom:14px;">
      <div class="card"><div class="card-title">System Health</div><div class="metric">${props.connected ? "Online" : "Offline"}</div></div>
      <div class="card"><div class="card-title">Agents</div><div class="metric">${props.agentCount}</div></div>
      <div class="card"><div class="card-title">Sessions</div><div class="metric">${props.sessionsCount ?? 0}</div></div>
    </section>

    <section class="card" style="margin-bottom:14px;">
      <div class="card-title">Mission Control</div>
      <div class="card-sub">Run your AI workforce from one place.</div>
      <div class="row" style="margin-top:10px;">
        <button class="btn" @click=${() => props.onOpenTab("chat")}>Open Chat</button>
        <button class="btn" @click=${() => props.onOpenTab("agents")}>Manage Agents</button>
        <button class="btn" @click=${() => props.onOpenTab("cron")}>Scheduler</button>
        <button class="btn" @click=${() => props.onOpenTab("logs")}>Logs</button>
      </div>
      <div class="muted" style="margin-top:8px;">Active instances: ${props.presenceCount}</div>
    </section>

    <section>
      <div class="card-title" style="margin-bottom:10px;">Apps Gallery</div>
      <div class="dashboard-app-grid">
        ${starterApps.map(
          (app) => html`
            <article class="dashboard-app-card" style=${`--app-accent:${app.accent}`}>
              <div class="dashboard-app-card__head">
                <span class="dashboard-app-card__icon">${app.icon}</span>
                <span class="dashboard-app-card__pill">ready</span>
              </div>
              <div class="dashboard-app-card__name">${app.name}</div>
              <div class="dashboard-app-card__role">${app.role}</div>
              <button class="btn" @click=${() => props.onOpenTab("chat")}>Open in chat</button>
            </article>
          `,
        )}
      </div>
    </section>
  `;
}
