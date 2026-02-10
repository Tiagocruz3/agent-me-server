import { randomUUID } from "node:crypto";
import type { GatewayRequestHandlers } from "./types.js";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { loadConfig } from "../../config/config.js";
import { upsertWorkspaceEnvVar } from "../../infra/env-file.js";
import { defaultRuntime } from "../../runtime.js";
import { WizardSession } from "../../wizard/session.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateWizardCancelParams,
  validateWizardNextParams,
  validateWizardStartParams,
  validateWizardStatusParams,
} from "../protocol/index.js";
import { formatForLog } from "../ws-log.js";

export const wizardHandlers: GatewayRequestHandlers = {
  "wizard.start": async ({ params, respond, context }) => {
    if (!validateWizardStartParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid wizard.start params: ${formatValidationErrors(validateWizardStartParams.errors)}`,
        ),
      );
      return;
    }
    const running = context.findRunningWizard();
    if (running) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "wizard already running"));
      return;
    }
    const sessionId = randomUUID();
    const opts = {
      mode: params.mode,
      workspace: typeof params.workspace === "string" ? params.workspace : undefined,
    };
    const session = new WizardSession((prompter) =>
      context.wizardRunner(opts, defaultRuntime, prompter),
    );
    context.wizardSessions.set(sessionId, session);
    const result = await session.next();
    if (result.done) {
      context.purgeWizardSession(sessionId);
    }
    respond(true, { sessionId, ...result }, undefined);
  },
  "wizard.next": async ({ params, respond, context }) => {
    if (!validateWizardNextParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid wizard.next params: ${formatValidationErrors(validateWizardNextParams.errors)}`,
        ),
      );
      return;
    }
    const sessionId = params.sessionId;
    const session = context.wizardSessions.get(sessionId);
    if (!session) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not found"));
      return;
    }
    const answer = params.answer as { stepId?: string; value?: unknown } | undefined;
    if (answer) {
      if (session.getStatus() !== "running") {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not running"));
        return;
      }
      try {
        await session.answer(String(answer.stepId ?? ""), answer.value);
      } catch (err) {
        respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, formatForLog(err)));
        return;
      }
    }
    const result = await session.next();
    if (result.done) {
      context.purgeWizardSession(sessionId);
    }
    respond(true, result, undefined);
  },
  "wizard.saveLocalEnv": ({ params, respond }) => {
    const entriesRaw = (params as { entries?: unknown }).entries;
    if (!Array.isArray(entriesRaw) || entriesRaw.length === 0) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "entries[] required"));
      return;
    }
    const entries = entriesRaw
      .map((entry) => {
        const key = (entry as { key?: unknown }).key;
        const value = (entry as { value?: unknown }).value;
        if (typeof key !== "string" || typeof value !== "string") {
          return null;
        }
        const trimmedKey = key.trim();
        if (!trimmedKey) {
          return null;
        }
        return { key: trimmedKey, value: value.trim() };
      })
      .filter((entry): entry is { key: string; value: string } => Boolean(entry));

    if (!entries.length) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "no valid env entries"));
      return;
    }

    const cfg = loadConfig();
    const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    const results: Array<{ key: string; path: string; updated: boolean; created: boolean }> = [];
    for (const entry of entries) {
      const write = upsertWorkspaceEnvVar({
        workspaceDir,
        key: entry.key,
        value: entry.value,
      });
      results.push({ key: entry.key, ...write });
    }

    respond(
      true,
      {
        ok: true,
        workspaceDir,
        path: `${workspaceDir}/.env`,
        results,
      },
      undefined,
    );
  },
  "wizard.cancel": ({ params, respond, context }) => {
    if (!validateWizardCancelParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid wizard.cancel params: ${formatValidationErrors(validateWizardCancelParams.errors)}`,
        ),
      );
      return;
    }
    const sessionId = params.sessionId;
    const session = context.wizardSessions.get(sessionId);
    if (!session) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not found"));
      return;
    }
    session.cancel();
    const status = {
      status: session.getStatus(),
      error: session.getError(),
    };
    context.wizardSessions.delete(sessionId);
    respond(true, status, undefined);
  },
  "wizard.status": ({ params, respond, context }) => {
    if (!validateWizardStatusParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid wizard.status params: ${formatValidationErrors(validateWizardStatusParams.errors)}`,
        ),
      );
      return;
    }
    const sessionId = params.sessionId;
    const session = context.wizardSessions.get(sessionId);
    if (!session) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "wizard not found"));
      return;
    }
    const status = {
      status: session.getStatus(),
      error: session.getError(),
    };
    if (status.status !== "running") {
      context.wizardSessions.delete(sessionId);
    }
    respond(true, status, undefined);
  },
};
