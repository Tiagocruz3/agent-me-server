import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".agentme"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", AGENTME_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".agentme-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", AGENTME_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".agentme"));
  });

  it("uses AGENTME_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", AGENTME_STATE_DIR: "/var/lib/agentme" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/agentme"));
  });

  it("expands ~ in AGENTME_STATE_DIR", () => {
    const env = { HOME: "/Users/test", AGENTME_STATE_DIR: "~/agentme-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/agentme-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { AGENTME_STATE_DIR: "C:\\State\\agentme" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\agentme");
  });
});
