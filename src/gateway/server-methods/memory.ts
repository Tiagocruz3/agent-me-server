import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import type { GatewayRequestHandlers } from "./types.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { loadConfig } from "../../config/config.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";

function resolveMemoryRoot() {
  const cfg = loadConfig();
  const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
  const memoryRoot = resolve(workspaceDir, "memory");
  mkdirSync(memoryRoot, { recursive: true });
  return { workspaceDir, memoryRoot };
}

function safePath(memoryRoot: string, relPath: string): string | null {
  if (!relPath || typeof relPath !== "string") {
    return null;
  }
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const abs = resolve(memoryRoot, normalized);
  const rel = relative(memoryRoot, abs);
  if (rel.startsWith("..") || rel.includes("..")) {
    return null;
  }
  if (!abs.endsWith(".md")) {
    return null;
  }
  return abs;
}

function listMarkdownFiles(dir: string, root: string, acc: string[]) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      listMarkdownFiles(full, root, acc);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    acc.push(relative(root, full).replace(/\\/g, "/"));
  }
}

export const memoryHandlers: GatewayRequestHandlers = {
  "memory.list": ({ respond }) => {
    try {
      const { memoryRoot } = resolveMemoryRoot();
      const files: string[] = [];
      listMarkdownFiles(memoryRoot, memoryRoot, files);
      files.sort((a, b) => a.localeCompare(b));
      respond(true, { files, root: memoryRoot }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL, String(err)));
    }
  },
  "memory.get": ({ params, respond }) => {
    const path = (params as { path?: unknown }).path;
    if (typeof path !== "string") {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "path required"));
      return;
    }
    try {
      const { memoryRoot } = resolveMemoryRoot();
      const abs = safePath(memoryRoot, path);
      if (!abs) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid path"));
        return;
      }
      const content = readFileSync(abs, "utf8");
      respond(true, { path, content }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL, String(err)));
    }
  },
  "memory.set": ({ params, respond }) => {
    const path = (params as { path?: unknown }).path;
    const content = (params as { content?: unknown }).content;
    if (typeof path !== "string" || typeof content !== "string") {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "path/content required"));
      return;
    }
    try {
      const { memoryRoot } = resolveMemoryRoot();
      const abs = safePath(memoryRoot, path);
      if (!abs) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid path"));
        return;
      }
      const parent = resolve(abs, "..");
      mkdirSync(parent, { recursive: true });
      writeFileSync(abs, content, "utf8");
      const size = statSync(abs).size;
      respond(true, { ok: true, path, bytes: size }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL, String(err)));
    }
  },
  "memory.rename": ({ params, respond }) => {
    const from = (params as { from?: unknown }).from;
    const to = (params as { to?: unknown }).to;
    if (typeof from !== "string" || typeof to !== "string") {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "from/to required"));
      return;
    }
    try {
      const { memoryRoot } = resolveMemoryRoot();
      const fromAbs = safePath(memoryRoot, from);
      const toAbs = safePath(memoryRoot, to);
      if (!fromAbs || !toAbs) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid path"));
        return;
      }
      if (!existsSync(fromAbs)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "source file not found"));
        return;
      }
      if (existsSync(toAbs)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "target file already exists"));
        return;
      }
      mkdirSync(resolve(toAbs, ".."), { recursive: true });
      renameSync(fromAbs, toAbs);
      respond(true, { ok: true, from, to }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL, String(err)));
    }
  },
  "memory.delete": ({ params, respond }) => {
    const path = (params as { path?: unknown }).path;
    if (typeof path !== "string") {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "path required"));
      return;
    }
    try {
      const { memoryRoot } = resolveMemoryRoot();
      const abs = safePath(memoryRoot, path);
      if (!abs) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "invalid path"));
        return;
      }
      if (!existsSync(abs)) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "file not found"));
        return;
      }
      unlinkSync(abs);
      respond(true, { ok: true, path }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.INTERNAL, String(err)));
    }
  },
};
