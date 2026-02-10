import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "agentme",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "agentme", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "agentme", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "agentme", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "agentme", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "agentme", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "agentme", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "agentme", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "agentme", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".agentme-dev");
    expect(env.AGENTME_PROFILE).toBe("dev");
    expect(env.AGENTME_STATE_DIR).toBe(expectedStateDir);
    expect(env.AGENTME_CONFIG_PATH).toBe(path.join(expectedStateDir, "agentme.json"));
    expect(env.AGENTME_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      AGENTME_STATE_DIR: "/custom",
      AGENTME_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.AGENTME_STATE_DIR).toBe("/custom");
    expect(env.AGENTME_GATEWAY_PORT).toBe("19099");
    expect(env.AGENTME_CONFIG_PATH).toBe(path.join("/custom", "agentme.json"));
  });

  it("uses AGENTME_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      AGENTME_HOME: "/srv/agentme-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/agentme-home");
    expect(env.AGENTME_STATE_DIR).toBe(path.join(resolvedHome, ".agentme-work"));
    expect(env.AGENTME_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".agentme-work", "agentme.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("agentme doctor --fix", {})).toBe("agentme doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("agentme doctor --fix", { AGENTME_PROFILE: "default" })).toBe(
      "agentme doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("agentme doctor --fix", { AGENTME_PROFILE: "Default" })).toBe(
      "agentme doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("agentme doctor --fix", { AGENTME_PROFILE: "bad profile" })).toBe(
      "agentme doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("agentme --profile work doctor --fix", { AGENTME_PROFILE: "work" }),
    ).toBe("agentme --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("agentme --dev doctor", { AGENTME_PROFILE: "dev" })).toBe(
      "agentme --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("agentme doctor --fix", { AGENTME_PROFILE: "work" })).toBe(
      "agentme --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("agentme doctor --fix", { AGENTME_PROFILE: "  jbagentme  " })).toBe(
      "agentme --profile jbagentme doctor --fix",
    );
  });

  it("handles command with no args after agentme", () => {
    expect(formatCliCommand("agentme", { AGENTME_PROFILE: "test" })).toBe(
      "agentme --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm agentme doctor", { AGENTME_PROFILE: "work" })).toBe(
      "pnpm agentme --profile work doctor",
    );
  });
});
