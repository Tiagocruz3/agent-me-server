import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { FullScreenCalendar, type CalendarData } from "./ui/fullscreen-calendar";

export class ReactCalendarHost extends LitElement {
  @property({ type: Array }) data: CalendarData[] = [];
  @property({ attribute: false })
  onSelectDay: ((day: Date) => void) | null = null;
  @property({ attribute: false })
  onNewEvent: (() => void) | null = null;

  private root: Root | null = null;

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.root = createRoot(this);
    this._renderReact();
  }

  updated() {
    this._renderReact();
  }

  private _renderReact() {
    if (!this.root) {
      return;
    }
    this.root.render(
      React.createElement(FullScreenCalendar, {
        data: this.data,
        onSelectDay: this.onSelectDay ?? undefined,
        onNewEvent: this.onNewEvent ?? undefined,
      }),
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.root?.unmount();
  }
}

customElements.define("react-calendar-host", ReactCalendarHost);
