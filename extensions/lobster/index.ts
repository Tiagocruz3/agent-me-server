import type {
  AnyAgentTool,
  AgentMePluginApi,
  AgentMePluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: AgentMePluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as AgentMePluginToolFactory,
    { optional: true },
  );
}
