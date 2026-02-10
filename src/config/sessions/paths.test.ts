import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStorePath } from "./paths.js";

describe("resolveStorePath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses AGENTME_HOME for tilde expansion", () => {
    vi.stubEnv("AGENTME_HOME", "/srv/agentme-home");
    vi.stubEnv("HOME", "/home/other");

    const resolved = resolveStorePath("~/.agentme/agents/{agentId}/sessions/sessions.json", {
      agentId: "research",
    });

    expect(resolved).toBe(
      path.resolve("/srv/agentme-home/.agentme/agents/research/sessions/sessions.json"),
    );
  });
});
