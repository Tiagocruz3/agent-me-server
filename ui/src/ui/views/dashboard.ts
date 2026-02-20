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

export function renderDashboard(props: DashboardProps) {
  const totalTasks = props.taskResults.length;
  const highPriority = props.taskResults.filter((item) => item.status === "error").length;
  const activeAgents = props.presenceCount;
  const taskCompletion = totalTasks
    ? Math.round(
        (props.taskResults.filter((item) => item.status === "success").length / totalTasks) * 100,
      )
    : 0;

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
      <div class="card-title">Agent Quick Access</div>
      <div class="card-sub">Your configured agents (no defaults)</div>
      <div class="row" style="justify-content: space-between; align-items:center; margin-top:10px; margin-bottom:10px;">
        <div class="muted">Create agents you need — nothing preinstalled.</div>
        <button class="btn primary" @click=${props.onAddAgent}>+ Add Agent</button>
      </div>
      <div class="dashboard-agent-grid" style="margin-top:10px;">
        ${props.featuredAgents.map(
          (app) => html`
            <article class="dashboard-agent-card" style=${`--app-accent:${app.accent}`}>
              <div class="dashboard-agent-card__top">
                <div class="dashboard-agent-avatar">${app.icon}</div>
                <div>
                  <div class="dashboard-app-card__name">${app.name}</div>
                  <div class="dashboard-app-card__role">${app.role}</div>
                </div>
              </div>
              <div class="row" style="margin-top:8px;">
                <button class="btn primary" @click=${() => props.onOpenAgentModal(app.id)}>Chat</button>
                <button class="btn" @click=${() => props.onRunTask(app.id)}>Run</button>
                <button class="btn" @click=${() => props.onScheduleTask(app.id)}>Schedule</button>
              </div>
            </article>
          `,
        )}
      </div>
      ${
        props.featuredAgents.length === 0
          ? html`
              <div class="card-sub" style="margin-top: 10px">
                No agents yet. Click <strong>Add Agent</strong> to create one with natural language.
              </div>
            `
          : ""
      }
    </section>

    <section class="card" style="margin-bottom:14px;">
      <div class="dashboard-toolbar">
        <input class="input" disabled value="Search agents, roles, tags..." />
        <div class="dashboard-toolbar__stats muted">
          <span>Agents <strong>${props.agentCount}</strong></span>
          <span>Tasks <strong>${totalTasks}</strong></span>
          <span>Completion <strong>${taskCompletion}%</strong></span>
        </div>
      </div>
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
          ${(props.recentActivity.length ? props.recentActivity : [{ label: "No activity yet" }]).slice(0, 6).map((item) => html`<div class="list-item"><span>${item.label}</span><span class="muted">${item.ts || ""}</span></div>`)}
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
              — ${item.summary}
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

    <section>
      <div class="card-title" style="margin-bottom:10px;">Agent Cards</div>
      <div class="dashboard-app-grid">
        ${props.featuredAgents.map(
          (app) => html`
            <article class="dashboard-app-card" style=${`--app-accent:${app.accent}`}>
              <div class="dashboard-app-card__head">
                <span class="dashboard-app-card__icon">${app.icon}</span>
                <span class="dashboard-app-card__pill">ready</span>
              </div>
              <div class="dashboard-app-card__name">${app.name}</div>
              <div class="dashboard-app-card__role">${app.role}</div>
              <div class="row">
                <button class="btn" @click=${() => props.onOpenAppChat(app.id)}>Open in chat</button>
                <button class="btn" @click=${() => props.onRunTask(app.id)}>Run task</button>
                <button class="btn" @click=${() => props.onScheduleTask(app.id)}>Schedule</button>
              </div>
            </article>
          `,
        )}
      </div>
    </section>

    ${
      props.agentModal
        ? html`
          <div class="agent-chat-modal-backdrop" @click=${props.onCloseAgentModal}></div>
          <section class="agent-chat-modal card">
            <div class="row" style="justify-content: space-between; align-items: center;">
              <div>
                <div class="card-title">Agent Chat Studio</div>
                <div class="card-sub">Direct chat, task prompt, system prompt, and avatar setup</div>
              </div>
              <button class="btn" @click=${props.onCloseAgentModal}>Close</button>
            </div>

            <label class="field" style="margin-top:10px;">
              <span>Avatar URL (profile picture)</span>
              <input
                class="input"
                .value=${props.agentAvatarDraft}
                @input=${(e: Event) => props.onAgentAvatarDraftChange((e.target as HTMLInputElement).value)}
                placeholder="https://..."
              />
            </label>
            <div class="row" style="margin-top:6px;"><button class="btn" @click=${props.onAgentSaveAvatar}>Save Avatar</button></div>

            <label class="field" style="margin-top:10px;">
              <span>System Prompt</span>
              <textarea
                class="textarea"
                .value=${props.agentSystemPromptDraft}
                @input=${(e: Event) =>
                  props.onAgentSystemPromptDraftChange((e.target as HTMLTextAreaElement).value)}
                rows="3"
              ></textarea>
            </label>
            <div class="row" style="margin-top:6px;"><button class="btn" @click=${props.onAgentSaveSystemPrompt}>Save System Prompt</button></div>

            <label class="field" style="margin-top:10px;">
              <span>Chat Message</span>
              <textarea
                class="textarea"
                .value=${props.agentChatDraft}
                @input=${(e: Event) => props.onAgentChatDraftChange((e.target as HTMLTextAreaElement).value)}
                rows="3"
              ></textarea>
            </label>
            <div class="row" style="margin-top:6px;"><button class="btn primary" @click=${props.onAgentSendChat}>Send to Agent Chat</button></div>

            <label class="field" style="margin-top:10px;">
              <span>Task Instruction</span>
              <textarea
                class="textarea"
                .value=${props.agentTaskDraft}
                @input=${(e: Event) => props.onAgentTaskDraftChange((e.target as HTMLTextAreaElement).value)}
                rows="2"
              ></textarea>
            </label>
            <div class="row" style="margin-top:6px;"><button class="btn" @click=${props.onAgentSetTask}>Set Task</button></div>
          </section>
        `
        : ""
    }
  `;
}
