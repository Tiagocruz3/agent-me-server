import { html, nothing } from "lit";
import type { ChannelUiMetaEntry, CronJob, CronRunLogEntry, CronStatus } from "../types.ts";
import type { CronFormState } from "../ui-types.ts";
import { formatRelativeTimestamp, formatMs } from "../format.ts";
import { pathForTab } from "../navigation.ts";
import { formatCronSchedule, formatNextRun } from "../presenter.ts";

export type CronProps = {
  basePath: string;
  loading: boolean;
  status: CronStatus | null;
  jobs: CronJob[];
  error: string | null;
  busy: boolean;
  form: CronFormState;
  channels: string[];
  channelLabels?: Record<string, string>;
  channelMeta?: ChannelUiMetaEntry[];
  runsJobId: string | null;
  runs: CronRunLogEntry[];
  onFormChange: (patch: Partial<CronFormState>) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onLoadRuns: (jobId: string) => void;
};

function buildChannelOptions(props: CronProps): string[] {
  const options = ["last", ...props.channels.filter(Boolean)];
  const current = props.form.deliveryChannel?.trim();
  if (current && !options.includes(current)) {
    options.push(current);
  }
  const seen = new Set<string>();
  return options.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function resolveChannelLabel(props: CronProps, channel: string): string {
  if (channel === "last") {
    return "last";
  }
  const meta = props.channelMeta?.find((entry) => entry.id === channel);
  if (meta?.label) {
    return meta.label;
  }
  return props.channelLabels?.[channel] ?? channel;
}

function toDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateTimeLocal(dayKey: string, hour = 9, minute = 0): string {
  return `${dayKey}T${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
}

function monthGrid(anchor: Date): Array<{ key: string; day: number; inMonth: boolean }> {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const cells: Array<{ key: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ key: `pad-${i}`, day: 0, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), day);
    cells.push({ key: toDayKey(d.getTime()), day, inMonth: true });
  }
  return cells;
}

export function renderCron(props: CronProps) {
  const channelOptions = buildChannelOptions(props);
  const selectedJob =
    props.runsJobId == null ? undefined : props.jobs.find((job) => job.id === props.runsJobId);
  const selectedRunTitle = selectedJob?.name ?? props.runsJobId ?? "(select a job)";
  const orderedRuns = props.runs.toSorted((a, b) => b.ts - a.ts);

  const todayKey = toDayKey(Date.now());
  const selectedDayKey =
    props.form.scheduleAt && props.form.scheduleAt.length >= 10
      ? props.form.scheduleAt.slice(0, 10)
      : todayKey;
  const agentFilter = props.form.agentId.trim().toLowerCase();
  const jobsFilteredByAgent = props.jobs.filter((job) => {
    if (!agentFilter) {
      return true;
    }
    return (job.agentId || "main").toLowerCase().includes(agentFilter);
  });
  const selectedDayJobs = jobsFilteredByAgent.filter(
    (job) => typeof job.state?.nextRunAtMs === "number" && toDayKey(job.state.nextRunAtMs) === selectedDayKey,
  );
  const anchor = new Date(`${selectedDayKey}T00:00:00`);
  const calendarCells = monthGrid(anchor);
  const weekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i);
    return toDayKey(d.getTime());
  });
  const jobsByDay = new Map<string, CronJob[]>();
  for (const job of jobsFilteredByAgent) {
    if (typeof job.state?.nextRunAtMs !== "number") {
      continue;
    }
    const key = toDayKey(job.state.nextRunAtMs);
    const arr = jobsByDay.get(key) ?? [];
    arr.push(job);
    jobsByDay.set(key, arr);
  }
  const viewMode =
    props.form.scheduleKind === "every"
      ? "day"
      : props.form.scheduleKind === "cron"
        ? "week"
        : "month";
  const drawerOpen = Boolean(props.form.name.trim() || props.form.payloadText.trim());

  return html`
    <section class="card cron-google">
      <div class="cron-google-topbar">
        <div class="row" style="gap:8px; align-items:center;">
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(todayKey) })}>Today</button>
          <button class="btn" @click=${() => {
            const d = new Date(anchor);
            d.setMonth(d.getMonth() - 1);
            props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(toDayKey(d.getTime())) });
          }}>◀</button>
          <button class="btn" @click=${() => {
            const d = new Date(anchor);
            d.setMonth(d.getMonth() + 1);
            props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(toDayKey(d.getTime())) });
          }}>▶</button>
          <div class="cron-master-month" style="margin:0;">${anchor.toLocaleString([], { month: "long", year: "numeric" })}</div>
        </div>
        <div class="row" style="gap:8px;">
          <button class="btn ${viewMode === "month" ? "primary" : ""}" @click=${() => props.onFormChange({ scheduleKind: "at" })}>Month</button>
          <button class="btn ${viewMode === "week" ? "primary" : ""}" @click=${() => props.onFormChange({ scheduleKind: "cron" })}>Week</button>
          <button class="btn ${viewMode === "day" ? "primary" : ""}" @click=${() => props.onFormChange({ scheduleKind: "every", everyAmount: "1", everyUnit: "days" })}>Day</button>
        </div>
      </div>
      <div class="card-sub">Google-calendar style planner for wakeups and recurring agent runs.</div>
      <div class="cron-master-controls" style="margin-top:10px;">
        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "every", everyAmount: "1", everyUnit: "days" })}>Daily</button>
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "cron", cronExpr: "0 9 * * 1-5" })}>Weekdays</button>
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "cron", cronExpr: "0 9 * * 1" })}>Weekly</button>
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "cron", cronExpr: "0 9 1 * *" })}>Monthly</button>
          <input
            class="input"
            style="min-width:180px"
            .value=${props.form.agentId}
            placeholder="Filter by agent id"
            @input=${(e: Event) => props.onFormChange({ agentId: (e.target as HTMLInputElement).value })}
          />
        </div>
      </div>

      <div class="cron-master-grid" style="margin-top:12px;">
        <div>
          ${viewMode === "month"
            ? html`
                <div class="cron-master-weekdays">
                  ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => html`<span>${d}</span>`) }
                </div>
                <div class="cron-master-calendar">
                  ${calendarCells.map((cell) => {
                    if (!cell.inMonth) {
                      return html`<span class="cron-master-day cron-master-day--pad"></span>`;
                    }
                    const dayJobs = jobsByDay.get(cell.key) ?? [];
                    const firstAgent = (dayJobs[0]?.agentId || "main").slice(0, 6);
                    return html`<button
                      class="cron-master-day ${cell.key === selectedDayKey ? "is-selected" : ""}
                      ${cell.key === todayKey ? "is-today" : ""}
                      ${dayJobs.length > 0 ? "has-jobs" : ""}"
                      @dragover=${(e: DragEvent) => e.preventDefault()}
                      @drop=${(e: DragEvent) => {
                        e.preventDefault();
                        const id = e.dataTransfer?.getData("text/plain");
                        const job = jobsFilteredByAgent.find((j) => j.id === id);
                        props.onFormChange({
                          scheduleKind: "at",
                          scheduleAt: toDateTimeLocal(cell.key),
                          name: job?.name ?? props.form.name,
                        });
                      }}
                      @click=${() =>
                        props.onFormChange({
                          scheduleKind: "at",
                          scheduleAt: toDateTimeLocal(cell.key),
                        })}
                    >
                      <span class="cron-master-day-num">${cell.day}</span>
                      ${dayJobs.length > 0
                        ? html`<span class="cron-master-day-badge">${firstAgent}${dayJobs.length > 1 ? ` +${dayJobs.length - 1}` : ""}</span>`
                        : nothing}
                    </button>`;
                  })}
                </div>
              `
            : viewMode === "week"
              ? html`<div class="cron-master-week-list">
                  ${weekKeys.map((key) => html`<button class="cron-master-day ${key === selectedDayKey ? "is-selected" : ""}" @click=${() => props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(key) })}>${key}</button>`)}
                </div>`
              : html`<div class="cron-master-day-focus">Focused day view: ${selectedDayKey}</div>`}
        </div>
        <div>
          <div class="card-title" style="font-size:14px;">Daily tasks · ${selectedDayKey}</div>
          <div class="list" style="margin-top:8px;">
            ${selectedDayJobs.length
              ? selectedDayJobs.map((job) => {
                  const recurring = job.schedule.kind !== "at";
                  return html`<div
                    class="list-item list-item-clickable"
                    draggable="true"
                    @dragstart=${(e: DragEvent) => e.dataTransfer?.setData("text/plain", job.id)}
                    @click=${() => props.onFormChange(toCronFormPatchFromJob(job))}
                  >
                    <span>${job.name}</span>
                    <span class="muted">${job.agentId || "main"}</span>
                    <span class="chip ${recurring ? "chip-ok" : ""}">${recurring ? "recurring" : "one-time"}</span>
                    <button
                      class="btn"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        props.onFormChange(toCronFormPatchFromJob(job));
                      }}
                    >
                      Edit
                    </button>
                  </div>`;
                })
              : html`<div class="muted">No tasks on this day.</div>`}
          </div>
          <label class="field" style="margin-top:10px;">
            <span>Natural language to action</span>
            <textarea
              rows="3"
              .value=${props.form.payloadText}
              placeholder="Every weekday at 9am, ask EMC2 to post daily priorities to Telegram"
              @input=${(e: Event) => props.onFormChange({ payloadText: (e.target as HTMLTextAreaElement).value })}
            ></textarea>
          </label>
        </div>
      </div>
    </section>

    ${drawerOpen
      ? html`
          <aside class="card cron-edit-drawer">
            <div class="row" style="justify-content:space-between; align-items:center;">
              <div class="card-title" style="font-size:14px;">Quick Edit</div>
              <button
                class="btn"
                @click=${() =>
                  props.onFormChange({
                    name: "",
                    description: "",
                    payloadText: "",
                    deliveryTo: "",
                    timeoutSeconds: "",
                  })}
              >
                Close
              </button>
            </div>
            <div class="card-sub">Google-calendar style side editor</div>
            <div class="form-grid" style="margin-top:10px;">
              <label class="field">
                <span>Task name</span>
                <input .value=${props.form.name} @input=${(e: Event) => props.onFormChange({ name: (e.target as HTMLInputElement).value })} />
              </label>
              <label class="field">
                <span>Agent</span>
                <input .value=${props.form.agentId} @input=${(e: Event) => props.onFormChange({ agentId: (e.target as HTMLInputElement).value })} />
              </label>
            </div>
            <label class="field" style="margin-top:10px;">
              <span>Task details</span>
              <textarea rows="3" .value=${props.form.payloadText} @input=${(e: Event) => props.onFormChange({ payloadText: (e.target as HTMLTextAreaElement).value })}></textarea>
            </label>
            <div class="row" style="margin-top:10px; gap:8px;">
              <button class="btn primary" ?disabled=${props.busy} @click=${props.onAdd}>Save job</button>
            </div>
          </aside>
        `
      : nothing}

    <section class="card cron-modal-launcher" style="margin-top: 14px;">
      <div class="card-title">Scheduler Panels</div>
      <div class="card-sub">Compact modal-style panels so the calendar stays the main focus.</div>
      <details class="cron-modal" style="margin-top:10px;">
        <summary class="btn">Scheduler Status</summary>
        <div class="cron-modal__body">
          <div class="stat-grid">
            <div class="stat"><div class="stat-label">Enabled</div><div class="stat-value">${props.status ? (props.status.enabled ? "Yes" : "No") : "n/a"}</div></div>
            <div class="stat"><div class="stat-label">Jobs</div><div class="stat-value">${props.status?.jobs ?? "n/a"}</div></div>
            <div class="stat"><div class="stat-label">Next wake</div><div class="stat-value">${formatNextRun(props.status?.nextWakeAtMs ?? null)}</div></div>
          </div>
          <div class="row" style="margin-top:10px;">
            <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>${props.loading ? "Refreshing…" : "Refresh"}</button>
            ${props.error ? html`<span class="muted">${props.error}</span>` : nothing}
          </div>
        </div>
      </details>

      <details class="cron-modal" style="margin-top:10px;" open>
        <summary class="btn primary">Create / Edit Job</summary>
        <div class="cron-modal__body">
          <div class="form-grid" style="margin-top: 12px;">
            <label class="field"><span>Name</span><input .value=${props.form.name} @input=${(e: Event) => props.onFormChange({ name: (e.target as HTMLInputElement).value })} /></label>
            <label class="field"><span>Description</span><input .value=${props.form.description} @input=${(e: Event) => props.onFormChange({ description: (e.target as HTMLInputElement).value })} /></label>
            <label class="field"><span>Agent ID</span><input .value=${props.form.agentId} @input=${(e: Event) => props.onFormChange({ agentId: (e.target as HTMLInputElement).value })} placeholder="default" /></label>
            <label class="field checkbox"><span>Enabled</span><input type="checkbox" .checked=${props.form.enabled} @change=${(e: Event) => props.onFormChange({ enabled: (e.target as HTMLInputElement).checked })} /></label>
            <label class="field"><span>Schedule</span><select .value=${props.form.scheduleKind} @change=${(e: Event) => props.onFormChange({ scheduleKind: (e.target as HTMLSelectElement).value as CronFormState["scheduleKind"] })}><option value="every">Every</option><option value="at">At</option><option value="cron">Cron</option></select></label>
          </div>
          ${renderScheduleFields(props)}
          <label class="field" style="margin-top: 10px;"><span>${props.form.payloadKind === "systemEvent" ? "System text" : "Agent message"}</span><textarea .value=${props.form.payloadText} @input=${(e: Event) => props.onFormChange({ payloadText: (e.target as HTMLTextAreaElement).value })} rows="4"></textarea></label>
          <div class="row" style="margin-top: 12px;"><button class="btn primary" ?disabled=${props.busy} @click=${props.onAdd}>${props.busy ? "Saving…" : "Save job"}</button></div>
        </div>
      </details>

      <details class="cron-modal" style="margin-top:10px;">
        <summary class="btn">Jobs & Run History</summary>
        <div class="cron-modal__body">
          <div class="card-sub">Jobs</div>
          ${props.jobs.length === 0 ? html`<div class="muted" style="margin-top: 8px">No jobs yet.</div>` : html`<div class="list" style="margin-top: 8px;">${props.jobs.map((job) => renderJob(job, props))}</div>`}
          <div class="card-sub" style="margin-top:12px;">Run history · ${selectedRunTitle}</div>
          ${props.runsJobId == null ? html`<div class="muted" style="margin-top: 8px">Select a job to inspect run history.</div>` : orderedRuns.length === 0 ? html`<div class="muted" style="margin-top: 8px">No runs yet.</div>` : html`<div class="list" style="margin-top: 8px;">${orderedRuns.map((entry) => renderRun(entry, props.basePath))}</div>`}
        </div>
      </details>
    </section>
  `;
}

function renderScheduleFields(props: CronProps) {
  const form = props.form;
  if (form.scheduleKind === "at") {
    return html`
      <label class="field" style="margin-top: 12px;">
        <span>Run at</span>
        <input
          type="datetime-local"
          .value=${form.scheduleAt}
          @input=${(e: Event) =>
            props.onFormChange({
              scheduleAt: (e.target as HTMLInputElement).value,
            })}
        />
      </label>
    `;
  }
  if (form.scheduleKind === "every") {
    return html`
      <div class="form-grid" style="margin-top: 12px;">
        <label class="field">
          <span>Every</span>
          <input
            .value=${form.everyAmount}
            @input=${(e: Event) =>
              props.onFormChange({
                everyAmount: (e.target as HTMLInputElement).value,
              })}
          />
        </label>
        <label class="field">
          <span>Unit</span>
          <select
            .value=${form.everyUnit}
            @change=${(e: Event) =>
              props.onFormChange({
                everyUnit: (e.target as HTMLSelectElement).value as CronFormState["everyUnit"],
              })}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </label>
      </div>
    `;
  }
  return html`
    <div class="form-grid" style="margin-top: 12px;">
      <label class="field">
        <span>Expression</span>
        <input
          .value=${form.cronExpr}
          @input=${(e: Event) =>
            props.onFormChange({ cronExpr: (e.target as HTMLInputElement).value })}
        />
      </label>
      <label class="field">
        <span>Timezone (optional)</span>
        <input
          .value=${form.cronTz}
          @input=${(e: Event) =>
            props.onFormChange({ cronTz: (e.target as HTMLInputElement).value })}
        />
      </label>
    </div>
  `;
}

function renderJob(job: CronJob, props: CronProps) {
  const isSelected = props.runsJobId === job.id;
  const itemClass = `list-item list-item-clickable cron-job${isSelected ? " list-item-selected" : ""}`;
  return html`
    <div class=${itemClass} @click=${() => props.onLoadRuns(job.id)}>
      <div class="list-main">
        <div class="list-title">${job.name}</div>
        <div class="list-sub">${formatCronSchedule(job)}</div>
        ${renderJobPayload(job)}
        ${job.agentId ? html`<div class="muted cron-job-agent">Agent: ${job.agentId}</div>` : nothing}
      </div>
      <div class="list-meta">
        ${renderJobState(job)}
      </div>
      <div class="cron-job-footer">
        <div class="chip-row cron-job-chips">
          <span class=${`chip ${job.enabled ? "chip-ok" : "chip-danger"}`}>
            ${job.enabled ? "enabled" : "disabled"}
          </span>
          <span class="chip">${job.sessionTarget}</span>
          <span class="chip">${job.wakeMode}</span>
        </div>
        <div class="row cron-job-actions">
          <button
            class="btn"
            ?disabled=${props.busy}
            @click=${(event: Event) => {
              event.stopPropagation();
              props.onToggle(job, !job.enabled);
            }}
          >
            ${job.enabled ? "Disable" : "Enable"}
          </button>
          <button
            class="btn"
            ?disabled=${props.busy}
            @click=${(event: Event) => {
              event.stopPropagation();
              props.onRun(job);
            }}
          >
            Run
          </button>
          <button
            class="btn"
            ?disabled=${props.busy}
            @click=${(event: Event) => {
              event.stopPropagation();
              props.onLoadRuns(job.id);
            }}
          >
            History
          </button>
          <button
            class="btn danger"
            ?disabled=${props.busy}
            @click=${(event: Event) => {
              event.stopPropagation();
              props.onRemove(job);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

function toCronFormPatchFromJob(job: CronJob): Partial<CronFormState> {
  const schedulePatch: Partial<CronFormState> =
    job.schedule.kind === "at"
      ? {
          scheduleKind: "at",
          scheduleAt: job.schedule.at.slice(0, 16),
        }
      : job.schedule.kind === "every"
        ? {
            scheduleKind: "every",
            everyAmount: String(Math.max(1, Math.round(job.schedule.everyMs / 60000))),
            everyUnit: "minutes",
          }
        : {
            scheduleKind: "cron",
            cronExpr: job.schedule.expr,
            cronTz: job.schedule.tz ?? "",
          };

  return {
    name: job.name,
    description: job.description ?? "",
    agentId: job.agentId ?? "main",
    enabled: job.enabled,
    sessionTarget: job.sessionTarget,
    wakeMode: job.wakeMode,
    payloadKind: job.payload.kind,
    payloadText: job.payload.kind === "systemEvent" ? job.payload.text : job.payload.message,
    deliveryMode: job.delivery?.mode ?? "announce",
    deliveryChannel: job.delivery?.channel ?? "last",
    deliveryTo: job.delivery?.to ?? "",
    timeoutSeconds:
      job.payload.kind === "agentTurn" && typeof job.payload.timeoutSeconds === "number"
        ? String(job.payload.timeoutSeconds)
        : "",
    ...schedulePatch,
  };
}

function renderJobPayload(job: CronJob) {
  if (job.payload.kind === "systemEvent") {
    return html`<div class="cron-job-detail">
      <span class="cron-job-detail-label">System</span>
      <span class="muted cron-job-detail-value">${job.payload.text}</span>
    </div>`;
  }

  const delivery = job.delivery;
  const deliveryTarget =
    delivery?.channel || delivery?.to
      ? ` (${delivery.channel ?? "last"}${delivery.to ? ` -> ${delivery.to}` : ""})`
      : "";

  return html`
    <div class="cron-job-detail">
      <span class="cron-job-detail-label">Prompt</span>
      <span class="muted cron-job-detail-value">${job.payload.message}</span>
    </div>
    ${
      delivery
        ? html`<div class="cron-job-detail">
            <span class="cron-job-detail-label">Delivery</span>
            <span class="muted cron-job-detail-value">${delivery.mode}${deliveryTarget}</span>
          </div>`
        : nothing
    }
  `;
}

function formatStateRelative(ms?: number) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    return "n/a";
  }
  return formatRelativeTimestamp(ms);
}

function renderJobState(job: CronJob) {
  const status = job.state?.lastStatus ?? "n/a";
  const statusClass =
    status === "ok"
      ? "cron-job-status-ok"
      : status === "error"
        ? "cron-job-status-error"
        : status === "skipped"
          ? "cron-job-status-skipped"
          : "cron-job-status-na";
  const nextRunAtMs = job.state?.nextRunAtMs;
  const lastRunAtMs = job.state?.lastRunAtMs;

  return html`
    <div class="cron-job-state">
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Status</span>
        <span class=${`cron-job-status-pill ${statusClass}`}>${status}</span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Next</span>
        <span class="cron-job-state-value" title=${formatMs(nextRunAtMs)}>
          ${formatStateRelative(nextRunAtMs)}
        </span>
      </div>
      <div class="cron-job-state-row">
        <span class="cron-job-state-key">Last</span>
        <span class="cron-job-state-value" title=${formatMs(lastRunAtMs)}>
          ${formatStateRelative(lastRunAtMs)}
        </span>
      </div>
    </div>
  `;
}

function renderRun(entry: CronRunLogEntry, basePath: string) {
  const chatUrl =
    typeof entry.sessionKey === "string" && entry.sessionKey.trim().length > 0
      ? `${pathForTab("chat", basePath)}?session=${encodeURIComponent(entry.sessionKey)}`
      : null;
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${entry.status}</div>
        <div class="list-sub">${entry.summary ?? ""}</div>
      </div>
      <div class="list-meta">
        <div>${formatMs(entry.ts)}</div>
        <div class="muted">${entry.durationMs ?? 0}ms</div>
        ${
          chatUrl
            ? html`<div><a class="session-link" href=${chatUrl}>Open run chat</a></div>`
            : nothing
        }
        ${entry.error ? html`<div class="muted">${entry.error}</div>` : nothing}
      </div>
    </div>
  `;
}
