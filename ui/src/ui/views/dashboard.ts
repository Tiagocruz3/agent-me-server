import { html } from "lit";

export type DashboardProps = {
  connected: boolean;
  agentCount: number;
  sessionsCount: number | null;
  presenceCount: number;
  queuedCount: number;
  autopilotMode: "off" | "assisted" | "full";
  agentModal: string | null;
  agentChatDraft: string;
  agentTaskDraft: string;
  agentSystemPromptDraft: string;
  agentAvatarDraft: string;
  featuredAgents: Array<{ id: string; name: string; role: string; accent: string; icon: string }>;
  recentActivity: Array<{ label: string; ts?: string }>;
  taskResults: Array<{
    app: string;
    appId: "realestate" | "birdx" | "emc2";
    summary: string;
    ts?: string;
    status: "running" | "success" | "error";
    schemaMismatch?: boolean;
  }>;
  onOpenTab: (tab: "agents" | "chat" | "cron" | "logs") => void;
  onOpenAppChat: (app: string) => void;
  onOpenAgentModal: (app: string) => void;
  onAddAgent: () => void;
  agentSearch: string;
  agentSort: "name" | "id";
  onAgentSearchChange: (text: string) => void;
  onAgentSortChange: (sort: "name" | "id") => void;
  onCloseAgentModal: () => void;
  onAgentChatDraftChange: (text: string) => void;
  onAgentTaskDraftChange: (text: string) => void;
  onAgentSystemPromptDraftChange: (text: string) => void;
  onAgentAvatarDraftChange: (text: string) => void;
  onAgentSendChat: () => void;
  onAgentSetTask: () => void;
  onAgentSaveSystemPrompt: () => void;
  onAgentSaveAvatar: () => void;
  onRunTask: (app: string) => void;
  onScheduleTask: (app: string) => void;
  onViewResult: (app: "realestate" | "birdx" | "emc2") => void;
  onFixSchema: (app: "realestate" | "birdx" | "emc2") => void;
  onSetAutopilotMode: (mode: "off" | "assisted" | "full") => void;
  onEmergencyStop: () => void;
};

function toDisplayText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value == null) {
    return "";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => toDisplayText(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [record.summary, record.message, record.text, record.title]
      .map((item) => toDisplayText(item))
      .find(Boolean);
    if (preferred) {
      return preferred;
    }
    return Object.entries(record)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${toDisplayText(v)}`)
      .join(" · ");
  }
  return String(value);
}

export function renderDashboard(props: DashboardProps) {
  const totalTasks = props.taskResults.length;
  const highPriority = props.taskResults.filter((item) => item.status === "error").length;
  const activeAgents = props.presenceCount;
  const taskCompletion = totalTasks
    ? Math.round(
        (props.taskResults.filter((item) => item.status === "success").length / totalTasks) * 100,
      )
    : 0;
  const q = props.agentSearch.trim().toLowerCase();
  const filteredAgents = [...props.featuredAgents]
    .filter((a) => {
      if (!q) {
        return true;
      }
      return `${a.name} ${a.role} ${a.id}`.toLowerCase().includes(q);
    })
    .sort((a, b) =>
      props.agentSort === "id" ? a.id.localeCompare(b.id) : a.name.localeCompare(b.name),
    );

  return html`
    <section class="dashboard-hero card" style="margin-bottom:14px;">
      <div>
        <div class="card-title">Dashboard</div>
        <div class="card-sub">Power control for your AI workforce.</div>
      </div>
      <div class="dashboard-hero__chips">
        <span class="result-status ${props.connected ? "result-status--success" : "result-status--error"}">
          ${props.connected ? "Connected" : "Disconnected"}
        </span>
        <span class="result-status result-status--running">Autopilot ${props.autopilotMode.toUpperCase()}</span>
      </div>
    </section>

    <section class="dashboard-kpis" style="margin-bottom:14px;">
      <article class="dashboard-kpi-card card">
        <div class="card-sub">Total Agents</div>
        <div class="metric">${props.agentCount}</div>
        <div class="dashboard-kpi-bar"><span style="width:${Math.min(100, props.agentCount * 20)}%"></span></div>
      </article>
      <article class="dashboard-kpi-card card">
        <div class="card-sub">Total Tasks</div>
        <div class="metric">${totalTasks}</div>
        <div class="dashboard-kpi-bar kpi-purple"><span style="width:${Math.min(100, totalTasks * 12)}%"></span></div>
      </article>
      <article class="dashboard-kpi-card card">
        <div class="card-sub">Active Agents</div>
        <div class="metric">${activeAgents}</div>
        <div class="dashboard-kpi-bar kpi-cyan"><span style="width:${Math.min(100, activeAgents * 25)}%"></span></div>
      </article>
      <article class="dashboard-kpi-card card">
        <div class="card-sub">High Priority</div>
        <div class="metric">${highPriority}</div>
        <div class="dashboard-kpi-bar kpi-amber"><span style="width:${Math.min(100, highPriority * 25)}%"></span></div>
      </article>
    </section>

    <section class="card" style="margin-bottom:14px;">
      <div class="dashboard-workforce-head">
        <div>
          <div class="card-title">My Digital Workforce</div>
          <div class="card-sub">Manage and monitor your AI agents</div>
        </div>
        <button class="btn primary" @click=${props.onAddAgent}>+ Create agent</button>
      </div>

      <div class="dashboard-workforce-filters" style="margin-top:12px;">
        <button class="btn" disabled>Agent Type: All</button>
        <label class="field" style="min-width:160px;">
          <span>Sort</span>
          <select
            .value=${props.agentSort}
            @change=${(e: Event) => props.onAgentSortChange((e.target as HTMLSelectElement).value as "name" | "id")}
          >
            <option value="name">Name</option>
            <option value="id">ID</option>
          </select>
        </label>
        <span class="muted">Active Agents ${filteredAgents.length}</span>
        <span class="dashboard-workforce-spacer"></span>
        <input
          class="input"
          placeholder="Search agents"
          .value=${props.agentSearch}
          @input=${(e: Event) => props.onAgentSearchChange((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="dashboard-agent-grid dashboard-agent-grid--workforce" style="margin-top:12px;">
        ${filteredAgents.map(
          (app) => html`
            <article class="dashboard-agent-card dashboard-agent-card--workforce" style=${`--app-accent:${app.accent}`}>
              <div class="dashboard-workforce-card-top">
                <span class="dashboard-workforce-status"><span class="dot"></span>Active</span>
                <span class="muted">•••</span>
              </div>
              <div class="dashboard-agent-avatar dashboard-agent-avatar--workforce">${app.icon}</div>
              <div class="dashboard-app-card__name">${app.name}</div>
              <div class="dashboard-app-card__role">${app.role}</div>
              <div class="row" style="margin-top:8px;">
                <button class="btn" @click=${() => props.onOpenAppChat(app.id)}>Open in chat</button>
                <button class="btn" @click=${() => props.onRunTask(app.id)}>Run task</button>
                <button class="btn" @click=${() => props.onScheduleTask(app.id)}>Schedule</button>
              </div>
            </article>
          `,
        )}
      </div>
      ${filteredAgents.length === 0 ? html`<div class="card-sub" style="margin-top:10px;">No agents match your search.</div>` : ""}
    </section>

    <section class="card" style="margin-bottom:14px;">
      <div class="card-title">Mission Control</div>
      <div class="card-sub">Quick-access power actions</div>
      <div class="row" style="margin-top:10px; flex-wrap: wrap;">
        <button class="btn primary" @click=${() => props.onOpenTab("chat")}>Open Chat</button>
        <button class="btn" @click=${() => props.onOpenTab("agents")}>Manage Agents</button>
        <button class="btn" @click=${() => props.onOpenTab("cron")}>Scheduler</button>
        <button class="btn" @click=${() => props.onOpenTab("logs")}>Logs</button>
      </div>
      <div class="row" style="margin-top:10px; align-items:center; gap:8px; flex-wrap: wrap;">
        <span class="muted">Autopilot:</span>
        <button class="btn ${props.autopilotMode === "off" ? "primary" : ""}" @click=${() => props.onSetAutopilotMode("off")}>Off</button>
        <button class="btn ${props.autopilotMode === "assisted" ? "primary" : ""}" @click=${() => props.onSetAutopilotMode("assisted")}>Assisted</button>
        <button class="btn ${props.autopilotMode === "full" ? "primary" : ""}" @click=${() => props.onSetAutopilotMode("full")}>Full</button>
        <button class="btn danger" @click=${() => props.onEmergencyStop()}>Emergency Stop</button>
      </div>
    </section>

    <section class="grid grid-cols-2" style="margin-bottom: 14px; align-items: start;">
      <div class="card">
        <div class="card-title">Live Activity Feed</div>
        <div class="list" style="margin-top:10px;">
          ${(props.recentActivity.length ? props.recentActivity : [{ label: "No activity yet" }])
            .slice(0, 6)
            .map(
              (item) =>
                html`<div class="list-item"><span>${toDisplayText(item.label)}</span><span class="muted">${item.ts || ""}</span></div>`,
            )}
        </div>
      </div>
      <div class="card">
        <div class="card-title">Task Queue</div>
        <div class="card-sub">Queued chat tasks waiting to run</div>
        <div class="metric">${props.queuedCount}</div>
        <div class="row" style="margin-top: 8px;">
          <button class="btn" @click=${() => props.onOpenTab("chat")}>Open Queue</button>
          <button class="btn" @click=${() => props.onOpenTab("logs")}>View Logs</button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-bottom:14px;">
      <div class="card-title">Task Results</div>
      <div class="list" style="margin-top:10px;">
        ${(props.taskResults.length
          ? props.taskResults
          : [
              {
                app: "system",
                appId: "emc2",
                summary: "No task results yet.",
                status: "success" as const,
              },
            ]
        )
          .slice(0, 5)
          .map(
            (item) => html`
          <div class="list-item" style="grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
            <span>
              <strong>${item.app}</strong>
              <span class="result-status result-status--${item.status}">${item.status}</span>
              ${
                item.schemaMismatch
                  ? html`
                      <span class="result-status result-status--mismatch">schema mismatch</span>
                    `
                  : ""
              }
              — ${toDisplayText(item.summary)}
              <span class="muted" style="margin-left:8px;">${item.ts || ""}</span>
            </span>
            <span class="row" style="gap:6px;">
              <button class="btn" @click=${() => props.onViewResult(item.appId)}>Open</button>
              <button class="btn" @click=${() => props.onRunTask(item.appId)}>Re-run</button>
              ${item.schemaMismatch ? html`<button class="btn" @click=${() => props.onFixSchema(item.appId)}>Fix format</button>` : ""}
            </span>
          </div>
        `,
          )}
      </div>
    </section>


  `;
}
