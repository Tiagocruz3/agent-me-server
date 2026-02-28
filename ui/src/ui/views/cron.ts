import { html } from "lit";
import type { ChannelUiMetaEntry, CronJob, CronRunLogEntry, CronStatus } from "../types.ts";
import type { CronFormState } from "../ui-types.ts";
import { formatCronSchedule, formatNextRun } from "../presenter.ts";

export type CronProps = {
  basePath: string;
  loading: boolean;
  status: CronStatus | null;
  jobs: CronJob[];
  error: string | null;
  busy: boolean;
  form: CronFormState;
  viewMode: "month" | "week" | "day";
  dayModalKey: string | null;
  channels: string[];
  channelLabels?: Record<string, string>;
  channelMeta?: ChannelUiMetaEntry[];
  runsJobId: string | null;
  runs: CronRunLogEntry[];
  onFormChange: (patch: Partial<CronFormState>) => void;
  onViewModeChange: (mode: "month" | "week" | "day") => void;
  onOpenDayModal: (dayKey: string) => void;
  onCloseDayModal: () => void;
  onRefresh: () => void;
  onAdd: () => void;
  onToggle: (job: CronJob, enabled: boolean) => void;
  onRun: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onLoadRuns: (jobId: string) => void;
};

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
  const modalDayKey = props.dayModalKey ?? selectedDayKey;
  const modalDayJobs = jobsFilteredByAgent.filter(
    (job) =>
      typeof job.state?.nextRunAtMs === "number" && toDayKey(job.state.nextRunAtMs) === modalDayKey,
  );
  const anchor = new Date(`${selectedDayKey}T00:00:00`);
  const calendarCells = monthGrid(anchor);
  const weekAnchor = new Date(anchor);
  const dayOfWeek = weekAnchor.getDay();
  weekAnchor.setDate(weekAnchor.getDate() - dayOfWeek);
  const weekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAnchor);
    d.setDate(weekAnchor.getDate() + i);
    return toDayKey(d.getTime());
  });
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
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
  const viewMode = "month" as const;

  return html`
    <section class="card cron-google">
      <div class="cron-google-topbar">
        <div class="row" style="gap:8px; align-items:center;">
          <button
            class="btn primary cron-create-task-btn"
            @click=${async () => {
              props.onFormChange({
                name: "New scheduled task",
                scheduleKind: "at",
                scheduleAt: toDateTimeLocal(selectedDayKey),
                payloadText: props.form.payloadText.trim() || "Reminder",
              });
              props.onAdd();
            }}
          >
            Create task
          </button>
          <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(todayKey) })}>Today</button>
          <button class="btn" @click=${() => {
            const d = new Date(anchor);
            d.setMonth(d.getMonth() - 1);
            props.onFormChange({
              scheduleKind: "at",
              scheduleAt: toDateTimeLocal(toDayKey(d.getTime())),
            });
          }}>◀</button>
          <button class="btn" @click=${() => {
            const d = new Date(anchor);
            d.setMonth(d.getMonth() + 1);
            props.onFormChange({
              scheduleKind: "at",
              scheduleAt: toDateTimeLocal(toDayKey(d.getTime())),
            });
          }}>▶</button>
          <div class="cron-master-month" style="margin:0;">${anchor.toLocaleString([], { month: "long", year: "numeric" })}</div>
        </div>
        <div class="row" style="gap:8px;">
          <span class="chip chip-ok">Month</span>
        </div>
      </div>
      <div class="card-sub">Planner for wakeups and recurring agent runs.</div>
      <div class="cron-google-shell ${viewMode === "month" ? "cron-google-shell--month" : ""}" style="margin-top:12px;">
        ${
          viewMode === "month"
            ? html``
            : html`<aside class="cron-google-sidebar">
                <button class="btn primary" style="width:100%; margin-top:6px;" @click=${() => {
                  props.onFormChange({
                    name: props.form.name || "New scheduled task",
                    scheduleKind: "at",
                    scheduleAt: toDateTimeLocal(selectedDayKey),
                  });
                  props.onOpenDayModal(selectedDayKey);
                }}>+ Create</button>
                <div class="cron-master-month" style="margin-top:10px;">${anchor.toLocaleString([], { month: "long", year: "numeric" })}</div>
                <div class="cron-master-weekdays">
                  ${["S", "M", "T", "W", "T", "F", "S"].map((d) => html`<span>${d}</span>`)}
                </div>
                <div class="cron-master-calendar">
                  ${calendarCells.map((cell) => {
                    if (!cell.inMonth) {
                      return html`
                        <span class="cron-master-day cron-master-day--pad"></span>
                      `;
                    }
                    const dayJobs = jobsByDay.get(cell.key) ?? [];
                    return html`<button
                      class="cron-master-day ${cell.key === selectedDayKey ? "is-selected" : ""}
                      ${cell.key === todayKey ? "is-today" : ""}
                      ${dayJobs.length > 0 ? "has-jobs" : ""}"
                      @click=${() => {
                        props.onFormChange({
                          scheduleKind: "at",
                          scheduleAt: toDateTimeLocal(cell.key),
                        });
                      }}
                      @dblclick=${() => {
                        props.onFormChange({
                          scheduleKind: "at",
                          scheduleAt: toDateTimeLocal(cell.key),
                        });
                        props.onOpenDayModal(cell.key);
                      }}
                    >
                      <span class="cron-master-day-num">${cell.day}</span>
                    </button>`;
                  })}
                </div>
                <div class="cron-sidebar-calendars">
                  <div class="muted" style="font-size:11px; margin-top:10px;">My calendars</div>
                  <div class="cron-sidebar-chip">Agent Me Ops</div>
                  <div class="cron-sidebar-chip">Automations</div>
                </div>
              </aside>`
        }

        <div class="cron-google-main">
          ${
            viewMode !== "month"
              ? html`<section class="cron-quick-create">
                  <div class="cron-quick-create__title">Quick event</div>
                  <div class="cron-quick-create__row">
                    <input
                      class="cron-quick-create__input"
                      .value=${props.form.name || ""}
                      placeholder="Add title"
                      @input=${(e: Event) => props.onFormChange({ name: (e.target as HTMLInputElement).value })}
                    />
                    <input
                      class="cron-quick-create__input"
                      type="datetime-local"
                      .value=${props.form.scheduleAt || toDateTimeLocal(selectedDayKey)}
                      @input=${(e: Event) => props.onFormChange({ scheduleKind: "at", scheduleAt: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div class="cron-quick-create__actions">
                    <button class="btn" @click=${() => props.onOpenDayModal(selectedDayKey)}>More options</button>
                    <button class="btn primary" @click=${() => {
                      props.onFormChange({
                        name: props.form.name.trim() || "New scheduled task",
                        scheduleKind: "at",
                        scheduleAt: props.form.scheduleAt || toDateTimeLocal(selectedDayKey),
                        payloadText: props.form.payloadText.trim() || "Reminder",
                      });
                      props.onAdd();
                    }}>Save</button>
                  </div>
                </section>`
              : html``
          }
          ${
            viewMode === "month"
              ? html`
                <div class="cron-master-weekdays">
                  ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => html`<span>${d}</span>`)}
                </div>
                <div class="cron-master-calendar cron-master-calendar--large">
                  ${calendarCells.map((cell) => {
                    if (!cell.inMonth) {
                      return html`
                        <span class="cron-master-day cron-master-day--pad"></span>
                      `;
                    }
                    const dayJobs = jobsByDay.get(cell.key) ?? [];
                    return html`<button class="cron-master-day ${cell.key === selectedDayKey ? "is-selected" : ""} ${cell.key === todayKey ? "is-today" : ""} ${dayJobs.length > 0 ? "has-jobs" : ""}" @click=${() => {
                      props.onFormChange({
                        scheduleKind: "at",
                        scheduleAt: toDateTimeLocal(cell.key),
                        name: props.form.name || "New scheduled task",
                      });
                      props.onOpenDayModal(cell.key);
                    }} @dblclick=${() => {
                      props.onFormChange({
                        scheduleKind: "at",
                        scheduleAt: toDateTimeLocal(cell.key),
                        name: props.form.name || "New scheduled task",
                      });
                      props.onOpenDayModal(cell.key);
                    }}>
                      <span class="cron-master-day-num">${cell.day}</span>
                      ${dayJobs.slice(0, 2).map((job) => html`<span class="cron-master-day-badge">${job.name.slice(0, 10)}</span>`)}
                    </button>`;
                  })}
                </div>
              `
              : viewMode === "day"
                ? html`
                  <div class="cron-google-week-header">
                    <div class="cron-google-weekday-head is-selected">${selectedDayKey}</div>
                  </div>
                  <div class="cron-google-week-grid cron-google-week-grid--day">
                    <div class="cron-time-rail">
                      ${hours.map((hour) => html`<div class="cron-time-rail__tick">${hour}:00</div>`)}
                    </div>
                    <div class="cron-google-week-col is-selected" @dblclick=${() => props.onOpenDayModal(selectedDayKey)}>
                      ${hours.map((hour) => {
                        const slotEvents = (jobsByDay.get(selectedDayKey) ?? []).filter(
                          (job) =>
                            typeof job.state?.nextRunAtMs === "number" &&
                            new Date(job.state.nextRunAtMs).getHours() === hour,
                        );
                        return html`<div class="cron-time-slot" @dragover=${(e: DragEvent) => e.preventDefault()} @drop=${(
                          e: DragEvent,
                        ) => {
                          e.preventDefault();
                          const id = e.dataTransfer?.getData("text/plain");
                          const job = jobsFilteredByAgent.find((j) => j.id === id);
                          props.onFormChange({
                            ...(job ? toCronFormPatchFromJob(job) : {}),
                            scheduleKind: "at",
                            scheduleAt: toDateTimeLocal(selectedDayKey, hour, 0),
                            name: job?.name ?? (props.form.name || "New scheduled task"),
                          });
                        }} @click=${() => props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(selectedDayKey, hour, 0), name: props.form.name || "New scheduled task" })}>
                          <div class="cron-time-slot__events">
                            ${slotEvents.map(
                              (job) => html`<button class="cron-google-event" @click=${(
                                e: Event,
                              ) => {
                                e.stopPropagation();
                                props.onFormChange(toCronFormPatchFromJob(job));
                              }}>
                              <span class="cron-google-event__title">${job.name}</span>
                              <span class="cron-google-event__meta">${job.agentId || "main"}</span>
                            </button>`,
                            )}
                          </div>
                        </div>`;
                      })}
                    </div>
                  </div>
                `
                : html`
                  <div class="cron-google-week-header">
                    ${weekKeys.map((key) => html`<div class="cron-google-weekday-head ${key === selectedDayKey ? "is-selected" : ""}">${key}</div>`)}
                  </div>
                  <div class="cron-google-week-grid">
                    <div class="cron-time-rail">
                      ${hours.map((hour) => html`<div class="cron-time-rail__tick">${hour}:00</div>`)}
                    </div>
                    ${weekKeys.map((key) => {
                      const dayJobs = jobsByDay.get(key) ?? [];
                      return html`<div class="cron-google-week-col ${key === selectedDayKey ? "is-selected" : ""}" @dblclick=${() => {
                        props.onFormChange({
                          scheduleKind: "at",
                          scheduleAt: toDateTimeLocal(key),
                          name: props.form.name || "New scheduled task",
                        });
                        props.onOpenDayModal(key);
                      }}>
                        ${hours.map((hour) => {
                          const slotEvents = dayJobs.filter(
                            (job) =>
                              typeof job.state?.nextRunAtMs === "number" &&
                              new Date(job.state.nextRunAtMs).getHours() === hour,
                          );
                          return html`<div class="cron-time-slot" @dragover=${(e: DragEvent) => e.preventDefault()} @drop=${(
                            e: DragEvent,
                          ) => {
                            e.preventDefault();
                            const id = e.dataTransfer?.getData("text/plain");
                            const job = jobsFilteredByAgent.find((j) => j.id === id);
                            props.onFormChange({
                              ...(job ? toCronFormPatchFromJob(job) : {}),
                              scheduleKind: "at",
                              scheduleAt: toDateTimeLocal(key, hour, 0),
                              name: job?.name ?? (props.form.name || "New scheduled task"),
                            });
                          }} @click=${() => props.onFormChange({ scheduleKind: "at", scheduleAt: toDateTimeLocal(key, hour, 0), name: props.form.name || "New scheduled task" })}>
                            <div class="cron-time-slot__events">
                              ${slotEvents.map(
                                (
                                  job,
                                ) => html`<button class="cron-google-event" draggable="true" @dragstart=${(e: DragEvent) => e.dataTransfer?.setData("text/plain", job.id)} @click=${(
                                  e: Event,
                                ) => {
                                  e.stopPropagation();
                                  props.onFormChange(toCronFormPatchFromJob(job));
                                }}>
                                <span class="cron-google-event__title">${job.name}</span>
                                <span class="cron-google-event__meta">${job.agentId || "main"}</span>
                              </button>`,
                              )}
                            </div>
                          </div>`;
                        })}
                      </div>`;
                    })}
                  </div>
                `
          }


        </div>
      </div>
    </section>

    ${
      props.dayModalKey
        ? html`
          <section class="card cron-day-modal">
            <div class="row" style="justify-content:space-between; align-items:center;">
              <div>
                <div class="card-title" style="font-size:14px;">Tasks for ${modalDayKey}</div>
                <div class="card-sub">${modalDayJobs.length} task${modalDayJobs.length === 1 ? "" : "s"} scheduled. Double-click any day to open this modal.</div>
              </div>
              <button class="btn" @click=${props.onCloseDayModal}>✕</button>
            </div>
            <div class="list" style="margin-top:10px;">
              ${
                modalDayJobs.length
                  ? modalDayJobs.map(
                      (job) =>
                        html`<div class="list-item list-item-clickable" @click=${() => props.onFormChange(toCronFormPatchFromJob(job))}><span>${job.name}</span><span class="muted">Agent: ${job.agentId || "main"}</span></div>`,
                    )
                  : html`
                      <div class="muted">No tasks for this day yet.</div>
                    `
              }
            </div>
            <div class="card-sub" style="margin-top:10px;">Create / Edit Job</div>
            <div class="form-grid" style="margin-top:8px;">
              <label class="field"><span>Task name</span><input .value=${props.form.name} @input=${(e: Event) => props.onFormChange({ name: (e.target as HTMLInputElement).value })} /></label>
              <label class="field"><span>Agent</span><input .value=${props.form.agentId} @input=${(e: Event) => props.onFormChange({ agentId: (e.target as HTMLInputElement).value })} placeholder="main" /></label>
              <label class="field"><span>Schedule</span><select .value=${props.form.scheduleKind} @change=${(e: Event) => props.onFormChange({ scheduleKind: (e.target as HTMLSelectElement).value as CronFormState["scheduleKind"] })}><option value="at">At</option><option value="every">Every</option><option value="cron">Cron</option></select></label>
            </div>
            ${renderScheduleFields(props)}
            <label class="field" style="margin-top:10px;"><span>Task details</span><textarea rows="3" .value=${props.form.payloadText} @input=${(e: Event) => props.onFormChange({ payloadText: (e.target as HTMLTextAreaElement).value })}></textarea></label>
            <div class="row" style="margin-top:10px; gap:8px; flex-wrap:wrap;">
              <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "every", everyAmount: "1", everyUnit: "days", scheduleAt: toDateTimeLocal(modalDayKey) })}>Daily</button>
              <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "cron", cronExpr: "0 9 * * 1-5", scheduleAt: toDateTimeLocal(modalDayKey) })}>Weekdays</button>
              <button class="btn" @click=${() => props.onFormChange({ scheduleKind: "cron", cronExpr: "0 9 * * 1", scheduleAt: toDateTimeLocal(modalDayKey) })}>Weekly</button>
            </div>
            <div class="row" style="margin-top:10px; gap:8px;">
              <button class="btn primary cron-create-task-btn" ?disabled=${props.busy} @click=${async () => {
                props.onFormChange({
                  name: props.form.name.trim() || "New scheduled task",
                  scheduleAt: props.form.scheduleAt || toDateTimeLocal(modalDayKey),
                  payloadText: props.form.payloadText.trim() || "Reminder",
                });
                props.onAdd();
                props.onCloseDayModal();
              }}>${props.busy ? "Saving…" : "Create task"}</button>
            </div>
            <div class="card-sub" style="margin-top:12px;">Scheduler Status</div>
            <div class="muted">Enabled: ${props.status ? (props.status.enabled ? "Yes" : "No") : "n/a"} · Jobs: ${props.status?.jobs ?? "n/a"} · Next wake: ${formatNextRun(props.status?.nextWakeAtMs ?? null)}</div>
            <div class="card-sub" style="margin-top:10px;">Jobs & Run History</div>
            <div class="list" style="margin-top:6px;">
              ${props.jobs.slice(0, 3).map((job) => html`<div class="list-item list-item-clickable" @click=${() => props.onLoadRuns(job.id)}><span>${job.name}</span><span class="muted">${formatCronSchedule(job)}</span></div>`)}
              ${
                props.jobs.length === 0
                  ? html`
                      <div class="muted">No jobs yet.</div>
                    `
                  : html``
              }
            </div>
          </section>
        `
        : html``
    }


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
