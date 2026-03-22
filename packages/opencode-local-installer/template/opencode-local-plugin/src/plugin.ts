import { createOpencodeExecuteTool, createOpencodeSessionAttachTool, createOpencodeSessionsListTool } from "./tool.js"

type OpenClawPluginApiLike = {
  registerTool: (tool: (ctx: {
    sessionKey?: string
    messageChannel?: string
    agentAccountId?: string
  }) => unknown, opts?: { optional?: boolean; names?: string[] }) => void
  config?: {
    agents?: {
      defaults?: {
        workspace?: string
      }
    }
  }
  pluginConfig?: Record<string, unknown>
}

export default function registerPlugin(api: OpenClawPluginApiLike) {
  api.registerTool((ctx) => createOpencodeExecuteTool(api, ctx), {
    optional: true,
    names: ["opencode_execute"],
  })
  api.registerTool((ctx) => createOpencodeSessionsListTool(api, ctx), {
    optional: true,
    names: ["opencode_sessions_list"],
  })
  api.registerTool((ctx) => createOpencodeSessionAttachTool(api, ctx), {
    optional: true,
    names: ["opencode_session_attach"],
  })
}
