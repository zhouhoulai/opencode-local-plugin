import path from "node:path"

import {
  attachSessionMapping,
  getSession,
  getSessionListSelection,
  listSessions,
  loadSessionListCache,
  resolveLocalOpencodeConfig,
  sendToOpencode,
  storeSessionListCache,
  type SendToOpencodeInput,
  type SendToOpencodeResult,
  type OpencodeSession,
  type SessionListCache,
} from "../../opencode-local/src/index.js"

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

type ToolContextLike = {
  sessionKey?: string
  messageChannel?: string
  agentAccountId?: string
}

type ExecuteParams = {
  conversationId?: unknown
  userId?: unknown
  text?: unknown
  directory?: unknown
  limit?: unknown
  sessionId?: unknown
  selection?: unknown
}

type ToolDependencies = {
  sendToOpencode: (
    input: SendToOpencodeInput,
    options?: {
      baseUrl?: string
      sessionStorePath?: string
    },
  ) => Promise<SendToOpencodeResult>
  listSessions: (
    directory: string,
    options?: {
      baseUrl?: string
      limit?: number
    },
  ) => Promise<OpencodeSession[]>
  getSession: (
    sessionId: string,
    options?: {
      baseUrl?: string
      directory: string
    },
  ) => Promise<OpencodeSession>
  attachSessionMapping: (
    sessionStorePath: string,
    input: {
      conversationId: string
      userId: string
      directory: string
    },
    sessionId: string,
  ) => Promise<void>
  loadSessionListCache: (filePath: string) => Promise<SessionListCache>
  storeSessionListCache: (
    filePath: string,
    key: string,
    value: {
      directory: string
      sessionIds: string[]
      updatedAt: number
    },
  ) => Promise<void>
}

type PartialToolDependencies = Partial<ToolDependencies>

const defaultDependencies: ToolDependencies = {
  sendToOpencode,
  listSessions: async (directory, options) =>
    listSessions(options?.baseUrl ?? "http://127.0.0.1:4096", directory, options?.limit),
  getSession: async (sessionId, options) =>
    getSession(options?.baseUrl ?? "http://127.0.0.1:4096", sessionId, options?.directory),
  attachSessionMapping,
  loadSessionListCache,
  storeSessionListCache,
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function readPositiveInt(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined
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

function resolveOptions(api: OpenClawPluginApiLike) {
  const pluginConfig = api.pluginConfig ?? {}
  const defaults = resolveLocalOpencodeConfig()
  const sessionStorePath = readString(pluginConfig.sessionStorePath) ?? defaults.sessionStorePath
  return {
    baseUrl: readString(pluginConfig.baseUrl) ?? defaults.baseUrl,
    sessionStorePath,
    sessionListCachePath: path.join(path.dirname(sessionStorePath), "session-list-cache.json"),
  }
}

function resolveIdentity(params: ExecuteParams, ctx: ToolContextLike) {
  const conversationId = readString(params.conversationId) ?? readString(ctx.sessionKey)
  if (!conversationId) throw new Error("conversationId required")

  const userId =
    readString(params.userId) ??
    readString(ctx.agentAccountId) ??
    readString(ctx.messageChannel) ??
    "current"

  return { conversationId, userId }
}

function formatSessionList(sessions: OpencodeSession[]) {
  if (sessions.length === 0) return "No OpenCode sessions found."
  return sessions
    .map((session, index) => {
      const updated = session.time?.updated ? new Date(session.time.updated).toISOString() : "unknown"
      const title = session.title ?? "(untitled)"
      return `${index + 1}. ${title} [${session.id}] updated=${updated} directory=${session.directory ?? "unknown"}`
    })
    .join("\n")
}

export function createOpencodeExecuteTool(
  api: OpenClawPluginApiLike,
  ctx: ToolContextLike = {},
  dependencies: PartialToolDependencies = defaultDependencies,
) {
  const resolvedDependencies = { ...defaultDependencies, ...dependencies }
  return {
    name: "opencode_execute",
    description: "Send a coding request to the local OpenCode server and return the final plain-text result.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["text"],
      properties: {
        conversationId: {
          type: "string",
          description: "Optional explicit conversation id. Defaults to the current OpenClaw session key.",
        },
        userId: {
          type: "string",
          description: "Optional explicit user id. Defaults to the current tool context.",
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
      const text = readString(params.text)
      if (!text) throw new Error("text required")

      const identity = resolveIdentity(params, ctx)
      const directory = resolveDirectory(params, api)
      const options = resolveOptions(api)
      const result = await resolvedDependencies.sendToOpencode(
        {
          conversationId: identity.conversationId,
          userId: identity.userId,
          text,
          directory,
        },
        {
          baseUrl: options.baseUrl,
          sessionStorePath: options.sessionStorePath,
        },
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

export function createOpencodeSessionsListTool(
  api: OpenClawPluginApiLike,
  ctx: ToolContextLike = {},
  dependencies: PartialToolDependencies = defaultDependencies,
) {
  const resolvedDependencies = { ...defaultDependencies, ...dependencies }
  return {
    name: "opencode_sessions_list",
    description: "List recent OpenCode sessions for a workspace so an existing session can be reused.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        directory: {
          type: "string",
          description: "Target workspace directory. Falls back to the agent workspace when omitted.",
        },
        limit: {
          type: "number",
          description: "Maximum number of sessions to return. Defaults to 10.",
        },
      },
    },
    async execute(_id: string, params: ExecuteParams) {
      const directory = resolveDirectory(params, api)
      const limit = readPositiveInt(params.limit) ?? 10
      const options = resolveOptions(api)
      const sessions = await resolvedDependencies.listSessions(directory, {
        baseUrl: options.baseUrl,
        limit,
      })

      const cacheKey = readString(ctx.sessionKey)
      if (cacheKey) {
        await resolvedDependencies.storeSessionListCache(options.sessionListCachePath, cacheKey, {
          directory,
          sessionIds: sessions.map((session) => session.id),
          updatedAt: Date.now(),
        })
      }

      return {
        content: [{ type: "text", text: formatSessionList(sessions) }],
        details: {
          directory,
          sessions,
        },
      }
    },
  }
}

export function createOpencodeSessionAttachTool(
  api: OpenClawPluginApiLike,
  ctx: ToolContextLike = {},
  dependencies: PartialToolDependencies = defaultDependencies,
) {
  const resolvedDependencies = { ...defaultDependencies, ...dependencies }
  return {
    name: "opencode_session_attach",
    description: "Attach an existing OpenCode session to the current chat mapping so future messages reuse it.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        selection: {
          type: "number",
          description: "1-based item number from the latest opencode_sessions_list result in this chat.",
        },
        sessionId: {
          type: "string",
          description: "Optional explicit session id when you already know it.",
        },
        directory: {
          type: "string",
          description: "Target workspace directory. Falls back to the agent workspace when omitted.",
        },
      },
    },
    async execute(_id: string, params: ExecuteParams) {
      const directory = resolveDirectory(params, api)
      const identity = resolveIdentity(params, ctx)
      const options = resolveOptions(api)

      let sessionId = readString(params.sessionId)
      if (!sessionId) {
        const selection = readPositiveInt(params.selection)
        if (!selection) throw new Error("selection or sessionId required")
        const cacheKey = readString(ctx.sessionKey)
        if (!cacheKey) throw new Error("current session context unavailable")
        const cache = await resolvedDependencies.loadSessionListCache(options.sessionListCachePath)
        sessionId = getSessionListSelection(cache, cacheKey, selection)
        if (!sessionId) throw new Error(`No cached session for selection ${selection}`)
      }

      await resolvedDependencies.getSession(sessionId, {
        baseUrl: options.baseUrl,
        directory,
      })

      await resolvedDependencies.attachSessionMapping(
        options.sessionStorePath,
        {
          conversationId: identity.conversationId,
          userId: identity.userId,
          directory,
        },
        sessionId,
      )

      return {
        content: [{ type: "text", text: `Attached OpenCode session ${sessionId} for the current chat.` }],
        details: {
          sessionId,
          directory,
        },
      }
    },
  }
}
