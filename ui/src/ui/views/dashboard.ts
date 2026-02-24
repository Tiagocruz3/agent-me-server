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
  onEditAgentProfile: (app: string) => void;
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
  dashboardView: "overview" | "autopilot" | "results";
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
  const showOverview = props.dashboardView === "overview";
  const showAutopilot = props.dashboardView === "autopilot";
  const showResults = props.dashboardView === "results";

  return html`
    <section class="dashboard-hero card" style="margin-bottom:14px;">
      <div>
        <div class="card-title">${showAutopilot ? "Autopilot Dashboard" : showResults ? "Task Results Dashboard" : "Agent Dashboard"}</div>
        <div class="card-sub">${showAutopilot ? "Autopilot and emergency controls." : showResults ? "Task results envelope store." : "Power control for your AI workforce."}</div>
      </div>
      <div class="dashboard-hero__chips">
        <span class="result-status ${props.connected ? "result-status--success" : "result-status--error"}">
          ${props.connected ? "Connected" : "Disconnected"}
        </span>
        <span class="result-status result-status--running">Autopilot ${props.autopilotMode.toUpperCase()}</span>
      </div>
    </section>

    ${showOverview
      ? html`
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

          <section class="card dashboard-ai-directory" style="margin-bottom:14px;">
            <div class="dashboard-workforce-head">
              <div>
                <div class="card-title">AI Agent</div>
                <div class="card-sub">Find your AI Agent quickly and assign tasks fast.</div>
              </div>
              <button class="btn primary" @click=${props.onAddAgent}>+ Create task</button>
            </div>

            <div class="dashboard-workforce-filters dashboard-workforce-filters--directory" style="margin-top:12px;">
              <input class="input" placeholder="Search for AI Agent..." .value=${props.agentSearch} @input=${(e: Event) => props.onAgentSearchChange((e.target as HTMLInputElement).value)} />
              <label class="field" style="min-width:130px;">
                <span>Sort</span>
                <select .value=${props.agentSort} @change=${(e: Event) => props.onAgentSortChange((e.target as HTMLSelectElement).value as "name" | "id")}>
                  <option value="name">Name</option>
                  <option value="id">ID</option>
                </select>
              </label>
            </div>

            <div class="dashboard-agent-tags" style="margin-top:10px;">
              ${["All Agents", "Business", "Coach", "Education", "Health", "Specialist"].map((tag, idx) => html`<button class="btn ${idx === 0 ? "primary" : ""}" ?disabled=${idx !== 0}>${tag}</button>`)}
            </div>

            <div class="dashboard-agent-grid dashboard-agent-grid--workforce" style="margin-top:12px;">
              ${filteredAgents.map(
                (app, idx) => html`
                  <article class="dashboard-agent-card dashboard-agent-card--workforce dashboard-agent-card--directory" style=${`--app-accent:${app.accent}`}>
                    <div class="dashboard-workforce-card-top">
                      <span class="dashboard-workforce-star">☆</span>
                      ${idx % 3 === 0 ? html`<span class="dashboard-workforce-premium">Premium</span>` : html`<span class="dashboard-workforce-status"><span class="dot"></span>Active</span>`}
                    </div>
                    <div class="dashboard-agent-avatar dashboard-agent-avatar--workforce">${app.icon}</div>
                    <div class="dashboard-app-card__name">${app.name}</div>
                    <div class="dashboard-app-card__role">${app.role}</div>
                    <div class="row" style="margin-top:8px; flex-wrap: wrap; justify-content:center;">
                      <button class="btn" @click=${() => props.onOpenAppChat(app.id)}>Open</button>
                      <button class="btn" @click=${() => props.onScheduleTask(app.id)}>Schedule</button>
                    </div>
                  </article>
                `,
              )}
            </div>
            ${filteredAgents.length === 0 ? html`<div class="card-sub" style="margin-top:10px;">No agents match your search.</div>` : ""}
          </section>
        `
      : ""}







    ${
      props.agentModal
        ? html`
            <section class="card" style="margin-top:14px; border-color: #6b5cf0;">
              <div class="card-title">Edit Agent Profile Picture</div>
              <div class="card-sub">Agent: ${props.agentModal}</div>
              <label class="field" style="margin-top:10px;">
                <span>Avatar (emoji, URL, or workspace path)</span>
                <input
                  class="input"
                  .value=${props.agentAvatarDraft}
                  placeholder="🤖 or https://... or avatars/emc2.png"
                  @input=${(e: Event) =>
                    props.onAgentAvatarDraftChange((e.target as HTMLInputElement).value)}
                />
              </label>
              <div class="row" style="margin-top:10px; gap:8px;">
                <button class="btn primary" @click=${props.onAgentSaveAvatar}>Save avatar</button>
                <button class="btn" @click=${props.onCloseAgentModal}>Cancel</button>
                <button class="btn" @click=${() => props.onEditAgentProfile(props.agentModal!)}>
                  Open full profile
                </button>
              </div>
            </section>
          `
        : ""
    }

  `;
}
