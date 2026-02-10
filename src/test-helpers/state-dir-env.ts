type StateDirEnvSnapshot = {
  agentmeStateDir: string | undefined;
  clawdbotStateDir: string | undefined;
};

export function snapshotStateDirEnv(): StateDirEnvSnapshot {
  return {
    agentmeStateDir: process.env.AGENTME_STATE_DIR,
    clawdbotStateDir: process.env.CLAWDBOT_STATE_DIR,
  };
}

export function restoreStateDirEnv(snapshot: StateDirEnvSnapshot): void {
  if (snapshot.agentmeStateDir === undefined) {
    delete process.env.AGENTME_STATE_DIR;
  } else {
    process.env.AGENTME_STATE_DIR = snapshot.agentmeStateDir;
  }
  if (snapshot.clawdbotStateDir === undefined) {
    delete process.env.CLAWDBOT_STATE_DIR;
  } else {
    process.env.CLAWDBOT_STATE_DIR = snapshot.clawdbotStateDir;
  }
}

export function setStateDirEnv(stateDir: string): void {
  process.env.AGENTME_STATE_DIR = stateDir;
  delete process.env.CLAWDBOT_STATE_DIR;
}
