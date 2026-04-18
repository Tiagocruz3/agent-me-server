import { html, nothing, type TemplateResult } from "lit";
import type { TaskResult, RecentItem, AgentApp } from "../types.ts";

export type DashboardProps = {
  connected: boolean;
  agentCount: number;
  recentActivity: RecentItem[];
  taskResults: TaskResult[];
  dashboardNotice: { text: string; tone: "info" | "success" | "error" | "warning" } | null;
  agentsList: { agents: AgentApp[]; count: number } | null;
  agentSearch: string;
  agentSort: "name" | "id";
  // Agent editing state
  editingAgentId: string | null;
  editingAgentName: string;
  editingAgentAvatar: string;
  onAddAgent: () => void;
  onAgentSearchChange: (v: string) => void;
  onAgentSortChange: (v: "name" | "id") => void;
  onClearNotice: () => void;
  // Navigation callbacks
  onNavigateToAgent: (agentId: string) => void;
  // Agent editing callbacks
  onStartEditAgent: (agentId: string, currentName: string, currentAvatar: string) => void;
  onCancelEditAgent: () => void;
  onSaveAgent: (agentId: string, newName: string, newAvatar: string) => void;
  onSaveAgentWithImage: (agentId: string, newName: string, imageFile: File) => void;
  onEditingNameChange: (v: string) => void;
  onEditingAvatarChange: (v: string) => void;
};

export function renderDashboard(props: DashboardProps) {
  const agents = props.agentsList?.agents ?? [];

  const filteredAgents = agents
    .filter((a) => {
      if (!props.agentSearch.trim()) {
        return true;
      }
      const q = props.agentSearch.toLowerCase();
      return a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    })
    .toSorted((a, b) => {
      if (props.agentSort === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.id.localeCompare(b.id);
    });

  return html`
    <section class="dashboard-hero card" style="margin-bottom:14px;">
      <div>
        <div class="card-title">Agent Dashboard</div>
        <div class="card-sub">Manage your AI workforce — ${props.agentCount} agent${props.agentCount !== 1 ? "s" : ""} configured</div>
      </div>
    </section>

    ${
      props.dashboardNotice
        ? html`<div class="callout ${props.dashboardNotice.tone}" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span>${props.dashboardNotice.text}</span>
          <button class="btn" @click=${props.onClearNotice}>Dismiss</button>
        </div>`
        : nothing
    }

    <!-- AI Agents Profile Cards -->
    <section class="card" style="margin-bottom:14px; padding: 20px;">
      <div class="agents-dashboard__header-content" style="margin-bottom: 20px;">
        <div>
          <div class="card-title">AI Agents</div>
          <div class="card-sub">${props.agentCount} agent${props.agentCount !== 1 ? "s" : ""} available</div>
        </div>
        <div class="agents-dashboard__header-actions">
          <button class="btn primary" @click=${props.onAddAgent}>
            <span style="margin-right: 4px;">+</span> Add Agent
          </button>
        </div>
      </div>

      <div class="agents-dashboard__filters" style="margin-bottom: 20px;">
        <input 
          class="input agents-dashboard__search" 
          placeholder="Search agents by name or ID..." 
          .value=${props.agentSearch}
          @input=${(e: Event) => props.onAgentSearchChange((e.target as HTMLInputElement).value)}
        />
        <label class="field" style="min-width: 130px; margin: 0;">
          <span>Sort</span>
          <select .value=${props.agentSort} @change=${(e: Event) => props.onAgentSortChange((e.target as HTMLSelectElement).value as "name" | "id")}>
            <option value="name">Name</option>
            <option value="id">ID</option>
          </select>
        </label>
      </div>

      <div class="agent-cards-grid">
        ${
          filteredAgents.length === 0
            ? html`
          <div class="card agents-dashboard__empty" style="grid-column: 1 / -1; text-align: center; padding: 48px 32px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
            <div class="card-title">No agents found</div>
            <div class="card-sub" style="margin-bottom: 20px;">
              ${props.agentSearch ? "No agents match your search." : "Get started by creating your first AI agent."}
            </div>
            ${!props.agentSearch ? html`<button class="btn primary" @click=${props.onAddAgent}>Create First Agent</button>` : ""}
          </div>
        `
            : filteredAgents.map((app, idx) => {
                const isDefault = app.id === "main";
                const accentColor = [
                  "#06b6d4",
                  "#8b5cf6",
                  "#0ea5e9",
                  "#f59e0b",
                  "#ef4444",
                  "#3b82f6",
                ][idx % 6];
                const isEditing = props.editingAgentId === app.id;

                if (isEditing) {
                  return renderEditCard(app, accentColor, props);
                }

                return renderAgentCard(app, isDefault, accentColor, props);
              })
        }
      </div>
    </section>
  `;
}

function renderAgentCard(
  app: AgentApp,
  isDefault: boolean,
  accentColor: string,
  props: DashboardProps,
): TemplateResult {
  // Check if avatar is an image URL (data URI or http URL)
  const hasImageAvatar =
    app.avatar && (app.avatar.startsWith("data:") || app.avatar.startsWith("http"));

  return html`
    <article class="agent-card" style="--agent-accent: ${accentColor}">
      <!-- Avatar - clicking opens edit modal -->
      <div 
        class="agent-card__avatar-wrap" 
        @click=${(e: Event) => {
          e.stopPropagation();
          props.onStartEditAgent(app.id, app.name, hasImageAvatar ? app.avatar! : app.icon);
        }}
      >
        <div class="agent-card__avatar">
          ${
            hasImageAvatar
              ? html`<img src="${app.avatar}" alt="${app.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
              : app.icon
          }
        </div>
        <div class="agent-card__avatar-edit-overlay">
          <span>📷 Change</span>
        </div>
        ${
          isDefault
            ? html`
                <span class="agent-card__badge">Default</span>
              `
            : nothing
        }
      </div>
      
      <!-- Name and role - clicking navigates to agent page -->
      <div 
        class="agent-card__info"
        @click=${() => props.onNavigateToAgent(app.id)}
      >
        <h3 class="agent-card__name">${app.name}</h3>
        <p class="agent-card__role">${app.role}</p>
        <span class="agent-card__hint">Click to configure</span>
      </div>
    </article>
  `;
}

function renderEditCard(app: AgentApp, accentColor: string, props: DashboardProps): TemplateResult {
  const fileInputId = `agent-avatar-file-${app.id}`;

  return html`
    <article class="agent-card agent-card--editing" style="--agent-accent: ${accentColor}">
      <input
        type="file"
        id="${fileInputId}"
        accept="image/*"
        hidden
        @change=${(e: Event) => {
          console.log("[AgentMe] File input change event fired");
          const input = e.target as HTMLInputElement;
          const file = input.files?.[0];
          console.log("[AgentMe] Selected file:", file?.name, file?.type, file?.size);
          if (file) {
            props.onSaveAgentWithImage(app.id, props.editingAgentName, file);
          } else {
            console.error("[AgentMe] No file selected");
          }
          input.value = "";
        }}
      />
      
      <div class="agent-card__edit-form">
        <!-- Avatar preview and upload -->
        <div class="agent-card__avatar-preview" style="margin-bottom: 16px;">
          <div class="agent-card__avatar" style="margin: 0 auto; width: 60px; height: 60px; font-size: 28px;">
            ${(() => {
              const avatar = props.editingAgentAvatar;
              const isImage = avatar && (avatar.startsWith("data:") || avatar.startsWith("http"));
              return isImage
                ? html`<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`
                : avatar;
            })()}
          </div>
        </div>
        
        <label class="field" style="margin: 0 0 12px 0;">
          <span>Avatar (emoji or URL)</span>
          <input 
            class="input" 
            .value=${props.editingAgentAvatar}
            placeholder="🤖 or https://..."
            @input=${(e: Event) => props.onEditingAvatarChange((e.target as HTMLInputElement).value)}
          />
        </label>
        
        <button 
          class="btn" 
          style="width: 100%; margin-bottom: 12px;"
          @click=${(e: Event) => {
            e.stopPropagation();
            console.log("[AgentMe] Upload button clicked, file input ID:", fileInputId);
            const fileInput = document.getElementById(fileInputId);
            console.log("[AgentMe] File input element:", fileInput);
            if (fileInput) {
              fileInput.click();
            } else {
              console.error("[AgentMe] File input not found!");
            }
          }}
        >
          📷 Upload Profile Picture
        </button>
        
        <label class="field" style="margin: 0 0 12px 0;">
          <span>Name</span>
          <input 
            class="input" 
            .value=${props.editingAgentName}
            placeholder="Agent name"
            @input=${(e: Event) => props.onEditingNameChange((e.target as HTMLInputElement).value)}
          />
        </label>
        
        <div class="row" style="gap: 8px;">
          <button 
            class="btn primary" 
            style="flex: 1;"
            @click=${() => props.onSaveAgent(app.id, props.editingAgentName, props.editingAgentAvatar)}
          >
            Save
          </button>
          <button class="btn" @click=${props.onCancelEditAgent}>Cancel</button>
        </div>
      </div>
    </article>
  `;
}
