import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "agentme", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "agentme", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "agentme", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "agentme", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "agentme", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "agentme", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "agentme", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "agentme"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "agentme", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "agentme", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "agentme", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "agentme", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "agentme", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "agentme", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "agentme", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "agentme", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "agentme", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "agentme", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "agentme", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "agentme", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "agentme", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "agentme", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node", "agentme", "status"],
    });
    expect(nodeArgv).toEqual(["node", "agentme", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node-22", "agentme", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "agentme", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node-22.2.0.exe", "agentme", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "agentme", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node-22.2", "agentme", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "agentme", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node-22.2.exe", "agentme", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "agentme", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["/usr/bin/node-22.2.0", "agentme", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "agentme", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["nodejs", "agentme", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "agentme", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["node-dev", "agentme", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "agentme", "node-dev", "agentme", "status"]);

    const directArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["agentme", "status"],
    });
    expect(directArgv).toEqual(["node", "agentme", "status"]);

    const bunArgv = buildParseArgv({
      programName: "agentme",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "agentme",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "agentme", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "agentme", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "agentme", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "agentme", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "agentme", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "agentme", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "agentme", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "agentme", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
