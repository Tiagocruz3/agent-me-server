import { html, nothing } from "lit";

type MemoryViewProps = {
  connected: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  files: string[];
  activePath: string | null;
  content: string;
  dirty: boolean;
  filterQuery: string;
  onRefresh: () => void;
  onSelect: (path: string) => void;
  onChangeContent: (value: string) => void;
  onSave: () => void;
  onChangeFilter: (value: string) => void;
  onCreate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onTemplate: (kind: "decision" | "todo" | "project" | "person") => void;
};

export function renderMemory(props: MemoryViewProps) {
  const q = props.filterQuery.trim().toLowerCase();
  const filtered = q ? props.files.filter((file) => file.toLowerCase().includes(q)) : props.files;

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; margin-bottom: 12px;">
        <div>
          <div class="label">Memory File Manager</div>
          <div class="muted">Browse and edit markdown memory files used by Agent Me.</div>
        </div>
        <div class="row">
          <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading}>Refresh</button>
          <button class="btn" @click=${props.onCreate} ?disabled=${props.saving}>New</button>
          <button class="btn" @click=${props.onRename} ?disabled=${!props.activePath || props.saving}>
            Rename
          </button>
          <button class="btn danger" @click=${props.onDelete} ?disabled=${!props.activePath || props.saving}>
            Delete
          </button>
          <button
            class="btn primary"
            @click=${props.onSave}
            ?disabled=${!props.dirty || props.saving || !props.activePath}
          >
            ${props.saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div class="row" style="margin-bottom: 12px; gap: 8px;">
        <input
          class="input"
          style="max-width: 320px;"
          placeholder="Filter files…"
          .value=${props.filterQuery}
          @input=${(event: Event) => props.onChangeFilter((event.target as HTMLInputElement).value)}
        />
        <button class="btn secondary" @click=${() => props.onTemplate("decision")}>Decision</button>
        <button class="btn secondary" @click=${() => props.onTemplate("todo")}>Todo</button>
        <button class="btn secondary" @click=${() => props.onTemplate("project")}>Project</button>
        <button class="btn secondary" @click=${() => props.onTemplate("person")}>Person</button>
      </div>

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
      ${
        !props.connected
          ? html`
              <div class="callout">Connect to gateway to use memory manager.</div>
            `
          : nothing
      }

      <div class="grid" style="grid-template-columns: 280px minmax(0,1fr); gap: 12px; min-height: 520px;">
        <div class="card" style="padding: 8px; overflow: auto;">
          ${
            filtered.length === 0
              ? html`
                  <div class="muted" style="padding: 10px">No memory files found.</div>
                `
              : filtered.map(
                  (file) => html`
                  <button
                    class="btn ${props.activePath === file ? "primary" : "secondary"}"
                    style="width: 100%; justify-content: flex-start; margin-bottom: 8px;"
                    @click=${() => props.onSelect(file)}
                  >
                    ${file}
                  </button>
                `,
                )
          }
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="mono" style="padding: 10px 12px; border-bottom: 1px solid var(--border);">
            ${props.activePath ?? "Select a file"}${props.dirty ? " • unsaved" : ""}
          </div>
          <textarea
            style="width: 100%; min-height: 470px; border: 0; padding: 12px; background: transparent; color: var(--text); resize: vertical; font-family: var(--mono);"
            .value=${props.content}
            @input=${(event: Event) =>
              props.onChangeContent((event.target as HTMLTextAreaElement).value)}
            ?disabled=${!props.activePath}
          ></textarea>
        </div>
      </div>
    </section>
  `;
}
