import { html, nothing } from "lit";
import type { GatewaySessionRow, SessionsListResult } from "../types.ts";
import { formatRelativeTimestamp } from "../format.ts";
import { pathForTab } from "../navigation.ts";
import { formatSessionTokens } from "../presenter.ts";

export type SessionsProps = {
  loading: boolean;
  result: SessionsListResult | null;
  error: string | null;
  activeMinutes: string;
  limit: string;
  includeGlobal: boolean;
  includeUnknown: boolean;
  searchQuery: string;
  basePath: string;
  onFiltersChange: (next: {
    activeMinutes: string;
    limit: string;
    includeGlobal: boolean;
    includeUnknown: boolean;
  }) => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onPatch: (
    key: string,
    patch: {
      label?: string | null;
      thinkingLevel?: string | null;
      verboseLevel?: string | null;
      reasoningLevel?: string | null;
    },
  ) => void;
  onDelete: (key: string) => void;
};

const THINK_LEVELS = ["", "off", "minimal", "low", "medium", "high", "xhigh"] as const;
const BINARY_THINK_LEVELS = ["", "off", "on"] as const;
const VERBOSE_LEVELS = [
  { value: "", label: "inherit" },
  { value: "off", label: "off (explicit)" },
  { value: "on", label: "on" },
  { value: "full", label: "full" },
] as const;
const REASONING_LEVELS = ["", "off", "on", "stream"] as const;

function normalizeProviderId(provider?: string | null): string {
  if (!provider) {
    return "";
  }
  const normalized = provider.trim().toLowerCase();
  if (normalized === "z.ai" || normalized === "z-ai") {
    return "zai";
  }
  return normalized;
}

function isBinaryThinkingProvider(provider?: string | null): boolean {
  return normalizeProviderId(provider) === "zai";
}

function resolveThinkLevelOptions(provider?: string | null): readonly string[] {
  return isBinaryThinkingProvider(provider) ? BINARY_THINK_LEVELS : THINK_LEVELS;
}

function withCurrentOption(options: readonly string[], current: string): string[] {
  if (!current) {
    return [...options];
  }
  if (options.includes(current)) {
    return [...options];
  }
  return [...options, current];
}

function withCurrentLabeledOption(
  options: readonly { value: string; label: string }[],
  current: string,
): Array<{ value: string; label: string }> {
  if (!current) {
    return [...options];
  }
  if (options.some((option) => option.value === current)) {
    return [...options];
  }
  return [...options, { value: current, label: `${current} (custom)` }];
}

function resolveThinkLevelDisplay(value: string, isBinary: boolean): string {
  if (!isBinary) {
    return value;
  }
  if (!value || value === "off") {
    return value;
  }
  return "on";
}

function resolveThinkLevelPatchValue(value: string, isBinary: boolean): string | null {
  if (!value) {
    return null;
  }
  if (!isBinary) {
    return value;
  }
  if (value === "on") {
    return "low";
  }
  return value;
}

function resolveSessionGroups(rows: GatewaySessionRow[]) {
  const now = Date.now();
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const groups: Record<string, GatewaySessionRow[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  for (const row of rows) {
    const ts = row.updatedAt ?? 0;
    if (ts >= todayStart) {
      groups.Today.push(row);
    } else if (ts >= yesterdayStart) {
      groups.Yesterday.push(row);
    } else if (ts >= weekStart) {
      groups["This week"].push(row);
    } else {
      groups.Older.push(row);
    }
  }

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

function filterSessions(rows: GatewaySessionRow[], query: string): GatewaySessionRow[] {
  if (!query.trim()) {
    return rows;
  }
  const lower = query.trim().toLowerCase();
  return rows.filter((row) => {
    const key = row.key.toLowerCase();
    const label = (row.label || "").toLowerCase();
    const displayName = (row.displayName || "").toLowerCase();
    const kind = row.kind.toLowerCase();
    return (
      key.includes(lower) ||
      label.includes(lower) ||
      displayName.includes(lower) ||
      kind.includes(lower)
    );
  });
}

export function renderSessions(props: SessionsProps) {
  const allRows = props.result?.sessions ?? [];
  const filteredRows = filterSessions(allRows, props.searchQuery);
  const groups = resolveSessionGroups(filteredRows);
  const hasFilters =
    props.activeMinutes || props.limit || props.includeGlobal || props.includeUnknown;

  return html`
    <section class="card sessions-card">
      <div class="sessions-header">
        <div>
          <div class="card-title">Sessions</div>
          <div class="card-sub">
            ${props.result ? `${props.result.count} total sessions` : "Active session keys and per-session overrides."}
          </div>
        </div>
        <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
          ${props.loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div class="sessions-toolbar">
        <div class="sessions-search">
          <input
            class="sessions-search__input"
            type="search"
            placeholder="Search sessions..."
            .value=${props.searchQuery}
            @input=${(e: Event) => props.onSearchChange((e.target as HTMLInputElement).value)}
          />
        </div>
        <details class="sessions-filters" ?open=${hasFilters}>
          <summary class="sessions-filters__summary">Filters</summary>
          <div class="sessions-filters__body">
            <label class="field">
              <span>Active within (minutes)</span>
              <input
                .value=${props.activeMinutes}
                @input=${(e: Event) =>
                  props.onFiltersChange({
                    activeMinutes: (e.target as HTMLInputElement).value,
                    limit: props.limit,
                    includeGlobal: props.includeGlobal,
                    includeUnknown: props.includeUnknown,
                  })}
              />
            </label>
            <label class="field">
              <span>Limit</span>
              <input
                .value=${props.limit}
                @input=${(e: Event) =>
                  props.onFiltersChange({
                    activeMinutes: props.activeMinutes,
                    limit: (e.target as HTMLInputElement).value,
                    includeGlobal: props.includeGlobal,
                    includeUnknown: props.includeUnknown,
                  })}
              />
            </label>
            <label class="field checkbox">
              <span>Include global</span>
              <input
                type="checkbox"
                .checked=${props.includeGlobal}
                @change=${(e: Event) =>
                  props.onFiltersChange({
                    activeMinutes: props.activeMinutes,
                    limit: props.limit,
                    includeGlobal: (e.target as HTMLInputElement).checked,
                    includeUnknown: props.includeUnknown,
                  })}
              />
            </label>
            <label class="field checkbox">
              <span>Include unknown</span>
              <input
                type="checkbox"
                .checked=${props.includeUnknown}
                @change=${(e: Event) =>
                  props.onFiltersChange({
                    activeMinutes: props.activeMinutes,
                    limit: props.limit,
                    includeGlobal: props.includeGlobal,
                    includeUnknown: (e.target as HTMLInputElement).checked,
                  })}
              />
            </label>
          </div>
        </details>
      </div>

      ${
        props.error
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
          : nothing
      }

      <div class="muted" style="margin-top: 12px;">
        ${props.result ? `Store: ${props.result.path}` : ""}
      </div>

      <div class="sessions-list">
        ${
          filteredRows.length === 0
            ? html`
                <div class="sessions-empty">No sessions found.</div>
              `
            : groups.map(([groupName, rows]) => renderGroup(groupName, rows, props))
        }
      </div>
    </section>
  `;
}

function renderGroup(groupName: string, rows: GatewaySessionRow[], props: SessionsProps) {
  return html`
    <div class="sessions-group">
      <div class="sessions-group__heading">${groupName}</div>
      <div class="sessions-group__items">
        ${rows.map((row) => renderSessionCard(row, props))}
      </div>
    </div>
  `;
}

function renderSessionCard(row: GatewaySessionRow, props: SessionsProps) {
  const updated = row.updatedAt ? formatRelativeTimestamp(row.updatedAt) : "n/a";
  const rawThinking = row.thinkingLevel ?? "";
  const isBinaryThinking = isBinaryThinkingProvider(row.modelProvider);
  const thinking = resolveThinkLevelDisplay(rawThinking, isBinaryThinking);
  const thinkLevels = withCurrentOption(resolveThinkLevelOptions(row.modelProvider), thinking);
  const verbose = row.verboseLevel ?? "";
  const verboseLevels = withCurrentLabeledOption(VERBOSE_LEVELS, verbose);
  const reasoning = row.reasoningLevel ?? "";
  const reasoningLevels = withCurrentOption(REASONING_LEVELS, reasoning);
  const displayName =
    typeof row.displayName === "string" && row.displayName.trim().length > 0
      ? row.displayName.trim()
      : null;
  const label = typeof row.label === "string" ? row.label.trim() : "";
  const showDisplayName = Boolean(displayName && displayName !== row.key && displayName !== label);
  const canLink = row.kind !== "global";
  const chatUrl = canLink
    ? `${pathForTab("chat", props.basePath)}?session=${encodeURIComponent(row.key)}`
    : null;
  const titleText = label || displayName || row.key;

  return html`
    <div class="session-card">
      <div class="session-card__main">
        <div class="session-card__identity">
          <div class="session-card__title-row">
            <span class="session-card__title" title=${titleText}>${titleText}</span>
            <span class="session-card__kind-badge ${row.kind}">${row.kind}</span>
          </div>
          <div class="session-card__key">${row.key}</div>
          ${
            showDisplayName
              ? html`<div class="session-card__display-name muted">${displayName}</div>`
              : nothing
          }
        </div>
        <div class="session-card__meta">
          <div class="session-card__meta-item">
            <span class="session-card__meta-label">Updated</span>
            <span class="session-card__meta-value">${updated}</span>
          </div>
          <div class="session-card__meta-item">
            <span class="session-card__meta-label">Tokens</span>
            <span class="session-card__meta-value">${formatSessionTokens(row)}</span>
          </div>
        </div>
      </div>

      <div class="session-card__settings">
        <label class="field session-card__field">
          <span>Label</span>
          <input
            .value=${row.label ?? ""}
            ?disabled=${props.loading}
            placeholder="(optional)"
            @change=${(e: Event) => {
              const value = (e.target as HTMLInputElement).value.trim();
              props.onPatch(row.key, { label: value || null });
            }}
          />
        </label>
        <label class="field session-card__field">
          <span>Thinking</span>
          <select
            ?disabled=${props.loading}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              props.onPatch(row.key, {
                thinkingLevel: resolveThinkLevelPatchValue(value, isBinaryThinking),
              });
            }}
          >
            ${thinkLevels.map(
              (level) =>
                html`<option value=${level} ?selected=${thinking === level}>
                  ${level || "inherit"}
                </option>`,
            )}
          </select>
        </label>
        <label class="field session-card__field">
          <span>Verbose</span>
          <select
            ?disabled=${props.loading}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              props.onPatch(row.key, { verboseLevel: value || null });
            }}
          >
            ${verboseLevels.map(
              (level) =>
                html`<option value=${level.value} ?selected=${verbose === level.value}>
                  ${level.label}
                </option>`,
            )}
          </select>
        </label>
        <label class="field session-card__field">
          <span>Reasoning</span>
          <select
            ?disabled=${props.loading}
            @change=${(e: Event) => {
              const value = (e.target as HTMLSelectElement).value;
              props.onPatch(row.key, { reasoningLevel: value || null });
            }}
          >
            ${reasoningLevels.map(
              (level) =>
                html`<option value=${level} ?selected=${reasoning === level}>
                  ${level || "inherit"}
                </option>`,
            )}
          </select>
        </label>
      </div>

      <div class="session-card__actions">
        ${canLink ? html`<a class="btn" href=${chatUrl} title="Open chat">Open chat</a>` : nothing}
        <button
          class="btn danger"
          ?disabled=${props.loading}
          @click=${() => props.onDelete(row.key)}
        >
          Delete
        </button>
      </div>
    </div>
  `;
}
