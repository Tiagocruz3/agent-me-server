import { html } from "lit";
import type { UiSettings } from "../storage.ts";

export type LoginViewProps = {
  settings: UiSettings;
  password: string;
  lastError: string | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onConnect: () => void;
};

export function renderLoginView(props: LoginViewProps) {
  return html`
    <section class="login-screen">
      <div class="login-screen__card">
        <div class="login-screen__brand">Agent Me</div>
        <h1>Sign in to your Agent Me Server</h1>
        <p>Connect securely to your gateway to access chat, control, and automation.</p>

        <label class="field">
          <span>Gateway URL</span>
          <input
            .value=${props.settings.gatewayUrl}
            @input=${(e: Event) => {
              const value = (e.target as HTMLInputElement).value;
              props.onSettingsChange({ ...props.settings, gatewayUrl: value });
            }}
            placeholder="wss://your-domain.com"
          />
        </label>

        <label class="field">
          <span>Gateway Token</span>
          <input
            .value=${props.settings.token}
            @input=${(e: Event) => {
              const value = (e.target as HTMLInputElement).value;
              props.onSettingsChange({ ...props.settings, token: value });
            }}
            placeholder="AGENTME_GATEWAY_TOKEN"
          />
        </label>

        <label class="field">
          <span>Password (if password mode)</span>
          <input
            type="password"
            .value=${props.password}
            @input=${(e: Event) => props.onPasswordChange((e.target as HTMLInputElement).value)}
            placeholder="Gateway password"
          />
        </label>

        <div class="row" style="margin-top: 8px;">
          <button class="btn primary" @click=${() => props.onConnect()}>Sign in</button>
        </div>

        ${
          props.lastError
            ? html`<div class="callout danger" style="margin-top: 12px;">${props.lastError}</div>`
            : ""
        }

        <details class="login-screen__help">
          <summary>Forgot access?</summary>
          <div class="muted" style="margin-top: 8px;">
            No-DB/basic mode reset is server-side. Use one of these on your VPS:
          </div>
          <pre><code>agentme doctor --generate-gateway-token
# then paste the new token here</code></pre>
          <div class="muted">Or update <span class="mono">AGENTME_GATEWAY_PASSWORD</span> / <span class="mono">gateway.auth.password</span> and restart gateway.</div>
        </details>
      </div>
    </section>
  `;
}
