import type { AgentMeApp } from "../app.ts";

type MemoryListResult = { files: string[] };

type MemoryGetResult = { path: string; content: string };

function normalizeMemoryPath(input: string) {
  let value = input.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!value.endsWith(".md")) {
    value = `${value}.md`;
  }
  return value;
}

export async function loadMemoryFiles(state: AgentMeApp) {
  if (!state.client || !state.connected) {
    state.memoryError = "Connect to gateway to load memory files.";
    return;
  }
  state.memoryLoading = true;
  state.memoryError = null;
  try {
    const res = await state.client.request<MemoryListResult>("memory.list", {});
    state.memoryFiles = Array.isArray(res.files) ? res.files : [];
    if (!state.memoryActivePath && state.memoryFiles.length > 0) {
      state.memoryActivePath = state.memoryFiles[0] ?? null;
      await loadMemoryFile(state, state.memoryActivePath);
    }
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memoryLoading = false;
  }
}

export async function loadMemoryFile(state: AgentMeApp, path: string) {
  if (!state.client || !state.connected) {
    state.memoryError = "Connect to gateway to load memory files.";
    return;
  }
  state.memoryLoading = true;
  state.memoryError = null;
  try {
    const res = await state.client.request<MemoryGetResult>("memory.get", { path });
    state.memoryActivePath = res.path;
    state.memoryContent = res.content ?? "";
    state.memoryDirty = false;
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memoryLoading = false;
  }
}

export async function saveMemoryFile(state: AgentMeApp) {
  if (!state.client || !state.connected || !state.memoryActivePath) {
    state.memoryError = "Connect and select a memory file first.";
    return;
  }
  state.memorySaving = true;
  state.memoryError = null;
  try {
    await state.client.request("memory.set", {
      path: state.memoryActivePath,
      content: state.memoryContent,
    });
    state.memoryDirty = false;
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memorySaving = false;
  }
}

export async function createMemoryFile(state: AgentMeApp, rawPath: string, template = "") {
  if (!state.client || !state.connected) {
    state.memoryError = "Connect to gateway to create files.";
    return;
  }
  const path = normalizeMemoryPath(rawPath);
  if (!path) {
    state.memoryError = "File name required.";
    return;
  }
  state.memorySaving = true;
  state.memoryError = null;
  try {
    const initial = template || `# ${path.replace(/\.md$/, "")}\n\n`;
    await state.client.request("memory.set", { path, content: initial });
    await loadMemoryFiles(state);
    await loadMemoryFile(state, path);
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memorySaving = false;
  }
}

export async function renameMemoryFile(state: AgentMeApp, from: string, toRaw: string) {
  if (!state.client || !state.connected) {
    state.memoryError = "Connect to gateway to rename files.";
    return;
  }
  const to = normalizeMemoryPath(toRaw);
  if (!to) {
    state.memoryError = "New file name required.";
    return;
  }
  state.memorySaving = true;
  state.memoryError = null;
  try {
    await state.client.request("memory.rename", { from, to });
    state.memoryActivePath = to;
    await loadMemoryFiles(state);
    await loadMemoryFile(state, to);
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memorySaving = false;
  }
}

export async function deleteMemoryFile(state: AgentMeApp, path: string) {
  if (!state.client || !state.connected) {
    state.memoryError = "Connect to gateway to delete files.";
    return;
  }
  state.memorySaving = true;
  state.memoryError = null;
  try {
    await state.client.request("memory.delete", { path });
    const wasActive = state.memoryActivePath === path;
    await loadMemoryFiles(state);
    if (wasActive) {
      const next = state.memoryFiles[0] ?? null;
      state.memoryActivePath = next;
      state.memoryContent = "";
      state.memoryDirty = false;
      if (next) {
        await loadMemoryFile(state, next);
      }
    }
  } catch (err) {
    state.memoryError = String(err);
  } finally {
    state.memorySaving = false;
  }
}
