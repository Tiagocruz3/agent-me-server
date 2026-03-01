import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }
  if (trimmed === "./") {
    return "./";
  }
  if (trimmed.endsWith("/")) {
    return trimmed;
  }
  return `${trimmed}/`;
}

export default defineConfig(() => {
  const envBase = process.env.AGENTME_CONTROL_UI_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "/";
  return {
    base,
    publicDir: path.resolve(here, "public"),
    optimizeDeps: {
      include: ["lit/directives/repeat.js"],
    },
    build: {
      outDir: path.resolve(here, "../dist/control-ui"),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/ui/src/ui/views/usage.ts")) {
              return "view-usage";
            }
            if (id.includes("/ui/src/ui/views/agents.ts")) {
              return "view-agents";
            }
            if (id.includes("/ui/src/ui/views/nodes.ts")) {
              return "view-nodes";
            }
            if (id.includes("/ui/src/ui/views/debug.ts")) {
              return "view-debug";
            }
            if (id.includes("/ui/src/ui/views/channels.ts")) {
              return "view-channels";
            }
            if (id.includes("/ui/src/ui/views/cron.ts")) {
              return "view-cron";
            }
            if (id.includes("node_modules")) {
              return "vendor";
            }
            return undefined;
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
  };
});
