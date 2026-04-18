import { html } from "lit";
import type { ThemeTransitionContext } from "../theme-transition.ts";
import type { ThemeMode } from "../theme.ts";

export type ThemesProps = {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode, context?: ThemeTransitionContext) => void;
};

function renderSunIcon() {
  return html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  `;
}

function renderMoonIcon() {
  return html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"
      ></path>
    </svg>
  `;
}

function renderMonitorIcon() {
  return html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2"></rect>
      <line x1="8" x2="16" y1="21" y2="21"></line>
      <line x1="12" x2="12" y1="17" y2="21"></line>
    </svg>
  `;
}

function renderCheckIcon() {
  return html`
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
}

const THEMES: Array<{
  id: ThemeMode;
  label: string;
  description: string;
  icon: () => ReturnType<typeof html>;
}> = [
  {
    id: "system",
    label: "System",
    description: "Follow your OS preference",
    icon: renderMonitorIcon,
  },
  {
    id: "light",
    label: "Light",
    description: "Clean with subtle warmth",
    icon: renderSunIcon,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Premium dark with neon accents",
    icon: renderMoonIcon,
  },
];

export function renderThemes(props: ThemesProps) {
  const handleSelect = (mode: ThemeMode) => (event: MouseEvent) => {
    const element = event.currentTarget as HTMLElement;
    const context: ThemeTransitionContext = { element };
    if (event.clientX || event.clientY) {
      context.pointerClientX = event.clientX;
      context.pointerClientY = event.clientY;
    }
    props.onThemeChange(mode, context);
  };

  return html`
    <section class="card">
      <div class="card-title">Themes</div>
      <div class="card-sub">Choose your preferred color scheme. The change is saved automatically.</div>

      <div class="theme-grid" style="margin-top:16px; display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:12px;">
        ${THEMES.map(
          (t) => html`
            <button
              class="theme-card ${props.theme === t.id ? "active" : ""}"
              @click=${handleSelect(t.id)}
              aria-pressed=${props.theme === t.id}
              style="position:relative; display:flex; flex-direction:column; align-items:center; gap:10px; padding:20px; border:1px solid var(--border-color); border-radius:var(--radius-lg); background:var(--bg-card); cursor:pointer; transition:all var(--duration-normal) var(--ease-out); text-align:center;"
            >
              <style>
                .theme-card:hover {
                  border-color: var(--border-strong) !important;
                  box-shadow: var(--shadow-md);
                  transform: translateY(-1px);
                }
                .theme-card.active {
                  border-color: var(--primary) !important;
                  box-shadow: 0 0 0 1px var(--primary), var(--shadow-md);
                }
                .theme-card .theme-card__icon {
                  width: 32px;
                  height: 32px;
                  color: var(--text-muted);
                  transition: color var(--duration-normal) var(--ease-out);
                }
                .theme-card.active .theme-card__icon {
                  color: var(--primary);
                }
                .theme-card__check {
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  width: 18px;
                  height: 18px;
                  color: var(--primary);
                  opacity: 0;
                  transform: scale(0.8);
                  transition: all var(--duration-normal) var(--ease-out);
                }
                .theme-card.active .theme-card__check {
                  opacity: 1;
                  transform: scale(1);
                }
                .theme-card__label {
                  font-size: 14px;
                  font-weight: 600;
                  color: var(--text-primary);
                }
                .theme-card__desc {
                  font-size: 12px;
                  color: var(--text-muted);
                  line-height: 1.4;
                }
              </style>
              <span class="theme-card__check" aria-hidden="true">${renderCheckIcon()}</span>
              <span class="theme-card__icon">${t.icon()}</span>
              <span class="theme-card__label">${t.label}</span>
              <span class="theme-card__desc">${t.description}</span>
            </button>
          `,
        )}
      </div>
    </section>
  `;
}
