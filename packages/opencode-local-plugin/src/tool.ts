import { sendToOpencode, type SendToOpencodeInput, type SendToOpencodeResult } from "../../opencode-local/src/index.js"

type OpenClawPluginApiLike = {
  config?: {
    agents?: {
      defaults?: {
        workspace?: string
      }
    }
  }
  pluginConfig?: Record<string, unknown>
}

type ExecuteParams = {
  conversationId?: unknown
  userId?: unknown
  text?: unknown
  directory?: unknown
}

type ToolDependencies = {
  sendToOpencode: (
    input: SendToOpencodeInput,
    options?: {
      baseUrl?: string
      sessionStorePath?: string
    },
  ) => Promise<SendToOpencodeResult>
}

const defaultDependencies: ToolDependencies = {
  sendToOpencode,
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function resolveDirectory(params: ExecuteParams, api: OpenClawPluginApiLike): string {
  const fromParams = readString(params.directory)
  if (fromParams) return fromParams

  const pluginConfig = api.pluginConfig ?? {}
  const fromPlugin = readString(pluginConfig.defaultDirectory)
  if (fromPlugin) return fromPlugin

  const fromWorkspace = readString(api.config?.agents?.defaults?.workspace)
  if (fromWorkspace) return fromWorkspace

  return process.cwd()
}

function resolveSendOptions(api: OpenClawPluginApiLike) {
  const pluginConfig = api.pluginConfig ?? {}
  return {
    baseUrl: readString(pluginConfig.baseUrl),
    sessionStorePath: readString(pluginConfig.sessionStorePath),
  }
}

export function createOpencodeExecuteTool(
  api: OpenClawPluginApiLike,
  dependencies: ToolDependencies = defaultDependencies,
) {
  return {
    name: "opencode_execute",
    description: "Send a coding request to the local OpenCode server and return the final plain-text result.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["conversationId", "userId", "text"],
      properties: {
        conversationId: {
          type: "string",
          description: "Stable conversation identifier used to reuse the same OpenCode session.",
        },
        userId: {
          type: "string",
          description: "Stable user identifier used in the session mapping key.",
        },
        text: {
          type: "string",
          description: "Instruction to send to OpenCode.",
        },
        directory: {
          type: "string",
          description: "Target workspace directory. Falls back to the agent workspace when omitted.",
        },
      },
    },
    async execute(_id: string, params: ExecuteParams) {
      const conversationId = readString(params.conversationId)
      if (!conversationId) throw new Error("conversationId required")

      const userId = readString(params.userId)
      if (!userId) throw new Error("userId required")

      const text = readString(params.text)
      if (!text) throw new Error("text required")

      const directory = resolveDirectory(params, api)
      const result = await dependencies.sendToOpencode(
        {
          conversationId,
          userId,
          text,
          directory,
        },
        resolveSendOptions(api),
      )

      return {
        content: [{ type: "text", text: result.reply }],
        details: {
          sessionId: result.sessionId,
          directory,
        },
      }
    },
  }
}
