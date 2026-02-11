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
  onRefresh: () => void;
  onSelect: (path: string) => void;
  onChangeContent: (value: string) => void;
  onSave: () => void;
};

export function renderMemory(props: MemoryViewProps) {
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; margin-bottom: 12px;">
        <div>
          <div class="label">Memory File Manager</div>
          <div class="muted">Browse and edit markdown memory files used by Agent Me.</div>
        </div>
        <div class="row">
          <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading}>Refresh</button>
          <button
            class="btn primary"
            @click=${props.onSave}
            ?disabled=${!props.dirty || props.saving || !props.activePath}
          >
            ${props.saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
      ${!props.connected ? html`<div class="callout">Connect to gateway to use memory manager.</div>` : nothing}

      <div class="grid" style="grid-template-columns: 280px minmax(0,1fr); gap: 12px; min-height: 520px;">
        <div class="card" style="padding: 8px; overflow: auto;">
          ${props.files.length === 0
            ? html`<div class="muted" style="padding: 10px;">No memory files found.</div>`
            : props.files.map(
                (file) => html`
                  <button
                    class="btn ${props.activePath === file ? "primary" : "secondary"}"
                    style="width: 100%; justify-content: flex-start; margin-bottom: 8px;"
                    @click=${() => props.onSelect(file)}
                  >
                    ${file}
                  </button>
                `,
              )}
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
