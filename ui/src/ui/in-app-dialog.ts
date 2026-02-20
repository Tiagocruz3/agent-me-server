type PromptOptions = {
  title?: string;
  message: string;
  initialValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
};

function ensureStyles() {
  if (document.getElementById("agentme-dialog-styles")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "agentme-dialog-styles";
  style.textContent = `
.agentme-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:400;display:flex;align-items:center;justify-content:center;padding:16px}
.agentme-dialog{width:min(560px,calc(100vw - 24px));background:#171b22;color:#e6edf3;border:1px solid #2b3340;border-radius:14px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.45)}
.agentme-dialog__title{font-weight:700;margin-bottom:6px}
.agentme-dialog__msg{color:#9aa6b2;margin-bottom:12px;white-space:pre-wrap}
.agentme-dialog__input{width:100%;border:1px solid #2f3745;background:#0f131a;color:#e6edf3;border-radius:10px;padding:10px;margin-bottom:12px}
.agentme-dialog__actions{display:flex;justify-content:flex-end;gap:8px}
.agentme-dialog__btn{border:1px solid #3b4556;background:#202734;color:#e6edf3;padding:8px 12px;border-radius:10px;cursor:pointer}
.agentme-dialog__btn.primary{background:linear-gradient(135deg,#22c55e,#16a34a);border-color:#22c55e;color:#fff}
`;
  document.head.appendChild(style);
}

function openBase(title: string, message: string) {
  ensureStyles();
  const backdrop = document.createElement("div");
  backdrop.className = "agentme-dialog-backdrop";
  const box = document.createElement("div");
  box.className = "agentme-dialog";
  box.innerHTML = `<div class="agentme-dialog__title"></div><div class="agentme-dialog__msg"></div><div class="agentme-dialog__actions"></div>`;
  (box.querySelector(".agentme-dialog__title") as HTMLDivElement).textContent = title;
  (box.querySelector(".agentme-dialog__msg") as HTMLDivElement).textContent = message;
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  return {
    backdrop,
    box,
    actions: box.querySelector(".agentme-dialog__actions") as HTMLDivElement,
  };
}

export function confirmInApp(message: string, title = "Confirm"): Promise<boolean> {
  return new Promise((resolve) => {
    const { backdrop, actions } = openBase(title, message);
    const cancel = document.createElement("button");
    cancel.className = "agentme-dialog__btn";
    cancel.textContent = "Cancel";
    cancel.onclick = () => {
      backdrop.remove();
      resolve(false);
    };
    const ok = document.createElement("button");
    ok.className = "agentme-dialog__btn primary";
    ok.textContent = "Confirm";
    ok.onclick = () => {
      backdrop.remove();
      resolve(true);
    };
    actions.append(cancel, ok);
  });
}

export function promptInApp(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const { backdrop, box, actions } = openBase(options.title ?? "Input required", options.message);
    const input = document.createElement("input");
    input.className = "agentme-dialog__input";
    input.placeholder = options.placeholder ?? "";
    input.value = options.initialValue ?? "";
    box.insertBefore(input, actions);
    const cancel = document.createElement("button");
    cancel.className = "agentme-dialog__btn";
    cancel.textContent = options.cancelText ?? "Cancel";
    cancel.onclick = () => {
      backdrop.remove();
      resolve(null);
    };
    const ok = document.createElement("button");
    ok.className = "agentme-dialog__btn primary";
    ok.textContent = options.confirmText ?? "OK";
    ok.onclick = () => {
      const val = input.value.trim();
      backdrop.remove();
      resolve(val.length ? val : null);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ok.click();
      }
    });
    actions.append(cancel, ok);
    input.focus();
  });
}
