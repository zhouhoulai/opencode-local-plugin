import { createOpencodeExecuteTool } from "./tool.js"

type OpenClawPluginApiLike = {
  registerTool: (tool: ReturnType<typeof createOpencodeExecuteTool>, opts?: { optional?: boolean }) => void
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
  api.registerTool(createOpencodeExecuteTool(api), { optional: true })
}
