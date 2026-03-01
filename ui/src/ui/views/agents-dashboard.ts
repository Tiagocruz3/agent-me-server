import { html, nothing } from "lit";
import type { AgentsListResult, AgentIdentityResult } from "../types.ts";

export type AgentsDashboardProps = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  agentsList: AgentsListResult | null;
  agentIdentityById: Record<string, AgentIdentityResult>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onAddAgent: () => void;
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onDuplicateAgent: (agentId: string) => void;
  onOpenAgentChat: (agentId: string) => void;
};

function normalizeAgentLabel(agent: {
  id: string;
  label?: string;
  identity?: { displayName?: string };
}): string {
  return agent.identity?.displayName?.trim() || agent.label?.trim() || agent.id;
}

function resolveAgentEmoji(
  agent: { id: string; identity?: { emoji?: string } },
  identity: AgentIdentityResult | null,
): string {
  return identity?.emoji?.trim() || agent.identity?.emoji?.trim() || "🤖";
}

function resolveAgentTheme(
  agent: { id: string; identity?: { theme?: string } },
  identity: AgentIdentityResult | null,
): string {
  return identity?.theme?.trim() || agent.identity?.theme?.trim() || "General purpose agent";
}

function getAgentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "running":
      return "#22c55e";
    case "idle":
    case "ready":
      return "#3b82f6";
    case "error":
    case "failed":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

export function renderAgentsDashboard(props: AgentsDashboardProps) {
  const agents = props.agentsList?.agents ?? [];
  const defaultId = props.agentsList?.defaultId ?? null;

  const query = props.searchQuery.trim().toLowerCase();
  const filteredAgents = agents.filter((agent) => {
    if (!query) {
      return true;
    }
    const identity = props.agentIdentityById[agent.id] ?? null;
    const label = normalizeAgentLabel(agent);
    const theme = resolveAgentTheme(agent, identity);
    return `${label} ${theme} ${agent.id}`.toLowerCase().includes(query);
  });

  return html`
    <section class="agents-dashboard">
      <!-- Header -->
      <div class="agents-dashboard__header card">
        <div class="agents-dashboard__header-content">
          <div>
            <div class="card-title">AI Agents</div>
            <div class="card-sub">Manage your AI workforce — ${agents.length} agent${agents.length !== 1 ? "s" : ""} configured</div>
          </div>
          <div class="agents-dashboard__header-actions">
            <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
              ${props.loading ? "Refreshing..." : "Refresh"}
            </button>
            <button class="btn primary" @click=${props.onAddAgent}>
              <span style="margin-right: 4px;">+</span> Add Agent
            </button>
          </div>
        </div>
        
        ${props.error ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>` : nothing}
        
        <!-- Search & Filters -->
        <div class="agents-dashboard__filters">
          <input 
            class="input agents-dashboard__search" 
            placeholder="Search agents by name, role, or ID..." 
            .value=${props.searchQuery}
            @input=${(e: Event) => props.onSearchChange((e.target as HTMLInputElement).value)}
          />
        </div>
        
        <!-- Category Tags -->
        <div class="agents-dashboard__tags">
          ${["All", "Active", "Idle", "Custom"].map(
            (tag, idx) => html`
            <button class="btn ${idx === 0 ? "primary" : ""}" ?disabled=${idx !== 0}>${tag}</button>
          `,
          )}
        </div>
      </div>

      <!-- Agents Grid -->
      <div class="agents-dashboard__grid">
        ${
          filteredAgents.length === 0
            ? html`
          <div class="card agents-dashboard__empty">
            <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
            <div class="card-title">No agents found</div>
            <div class="card-sub" style="margin-bottom: 20px;">
              ${query ? "No agents match your search." : "Get started by creating your first AI agent."}
            </div>
            ${!query ? html`<button class="btn primary" @click=${props.onAddAgent}>Create First Agent</button>` : nothing}
          </div>
        `
            : filteredAgents.map((agent) => {
                const identity = props.agentIdentityById[agent.id] ?? null;
                const label = normalizeAgentLabel(agent);
                const emoji = resolveAgentEmoji(agent, identity);
                const theme = resolveAgentTheme(agent, identity);
                const isDefault = agent.id === defaultId;
                const status = "Active"; // TODO: Get real status

                return html`
            <article class="agent-profile-card">
              <div class="agent-profile-card__header">
                <div class="agent-profile-card__avatar">${emoji}</div>
                <div class="agent-profile-card__status" style="--status-color: ${getAgentStatusColor(status)}">
                  <span class="agent-profile-card__status-dot"></span>
                  ${status}
                </div>
                ${
                  isDefault
                    ? html`
                        <span class="agent-profile-card__badge">Default</span>
                      `
                    : nothing
                }
              </div>
              
              <div class="agent-profile-card__body">
                <h3 class="agent-profile-card__name">${label}</h3>
                <p class="agent-profile-card__role">${theme}</p>
                <code class="agent-profile-card__id">${agent.id}</code>
              </div>
              
              <div class="agent-profile-card__stats">
                <div class="agent-profile-card__stat">
                  <span class="agent-profile-card__stat-value">${agent.model ? "GPT-4" : "AI"}</span>
                  <span class="agent-profile-card__stat-label">Model</span>
                </div>
                <div class="agent-profile-card__stat">
                  <span class="agent-profile-card__stat-value">${agent.tools?.length || 0}</span>
                  <span class="agent-profile-card__stat-label">Tools</span>
                </div>
                <div class="agent-profile-card__stat">
                  <span class="agent-profile-card__stat-value">${agent.skills?.length || 0}</span>
                  <span class="agent-profile-card__stat-label">Skills</span>
                </div>
              </div>
              
              <div class="agent-profile-card__actions">
                <button class="btn btn--sm" @click=${() => props.onOpenAgentChat(agent.id)} title="Chat">
                  💬
                </button>
                <button class="btn btn--sm" @click=${() => props.onEditAgent(agent.id)} title="Edit">
                  ✏️
                </button>
                <button class="btn btn--sm" @click=${() => props.onDuplicateAgent(agent.id)} title="Duplicate">
                  📋
                </button>
                ${
                  !isDefault
                    ? html`
                  <button class="btn btn--sm btn--danger" @click=${() => props.onDeleteAgent(agent.id)} title="Delete">
                    🗑️
                  </button>
                `
                    : nothing
                }
              </div>
            </article>
          `;
              })
        }
      </div>
    </section>
  `;
}
