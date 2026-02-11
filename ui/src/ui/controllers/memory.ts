import type { AgentMeApp } from "../app.ts";

type MemoryListResult = { files: string[] };

type MemoryGetResult = { path: string; content: string };

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
