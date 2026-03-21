import test, { mock } from "node:test"
import assert from "node:assert/strict"

import registerPlugin, {
  createOpencodeExecuteTool,
  createOpencodeSessionAttachTool,
  createOpencodeSessionsListTool,
} from "../src/index.js"

function createApi(overrides: Record<string, unknown> = {}) {
  const registerTool = mock.fn()
  return {
    id: "opencode-local",
    name: "OpenCode Local",
    source: "test",
    config: {
      agents: {
        defaults: {
          workspace: "/tmp/workspace",
        },
      },
    },
    pluginConfig: {},
    runtime: { version: "test" },
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    registerTool,
    ...overrides,
  }
}

function firstCallArgument(fn: ReturnType<typeof mock.fn>, index: number) {
  const call = fn.mock.calls[0]
  assert.ok(call)
  return call.arguments[index]
}

test("plugin registers opencode_execute as an optional tool", async () => {
  const api = createApi()

  await registerPlugin(api as never)

  assert.equal(api.registerTool.mock.callCount(), 3)
  assert.deepEqual(api.registerTool.mock.calls.map((call) => (call.arguments[1] as { names?: string[] }).names?.[0]), [
    "opencode_execute",
    "opencode_sessions_list",
    "opencode_session_attach",
  ])
  for (const call of api.registerTool.mock.calls) {
    assert.equal((call.arguments[1] as { optional?: boolean } | undefined)?.optional, true)
  }
})

test("tool sends the request to opencode and returns text content", async () => {
  const sendToOpencode = mock.fn(async () => ({
    sessionId: "ses_123",
    reply: "done",
  }))
  const tool = createOpencodeExecuteTool(createApi() as never, {}, {
    sendToOpencode,
  })

  const result = await tool.execute("tool-call-1", {
    conversationId: "chat-1",
    userId: "user-1",
    text: "hello",
    directory: "/tmp/project",
  })

  assert.equal(sendToOpencode.mock.callCount(), 1)
  assert.deepEqual(firstCallArgument(sendToOpencode, 0), {
    conversationId: "chat-1",
    userId: "user-1",
    text: "hello",
    directory: "/tmp/project",
  })
  assert.deepEqual(result, {
    content: [{ type: "text", text: "done" }],
    details: {
      sessionId: "ses_123",
      directory: "/tmp/project",
    },
  })
})

test("tool falls back to the agent workspace when directory is omitted", async () => {
  const sendToOpencode = mock.fn(async () => ({
    sessionId: "ses_123",
    reply: "done",
  }))
  const tool = createOpencodeExecuteTool(createApi() as never, {}, {
    sendToOpencode,
  })

  await tool.execute("tool-call-1", {
    conversationId: "chat-1",
    userId: "user-1",
    text: "hello",
  })

  assert.equal(sendToOpencode.mock.callCount(), 1)
  const input = firstCallArgument(sendToOpencode, 0) as { directory: string }
  assert.equal(input.directory, "/tmp/workspace")
})

test("tool rejects empty text before sending anything", async () => {
  const sendToOpencode = mock.fn(async () => ({
    sessionId: "ses_123",
    reply: "done",
  }))
  const tool = createOpencodeExecuteTool(createApi() as never, {}, {
    sendToOpencode,
  })

  await assert.rejects(
    () =>
      tool.execute("tool-call-1", {
        conversationId: "chat-1",
        userId: "user-1",
        text: "   ",
      }),
    /text required/,
  )
  assert.equal(sendToOpencode.mock.callCount(), 0)
})

test("sessions list tool returns text and details", async () => {
  const listSessions = mock.fn(async () => [
    {
      id: "ses_123",
      directory: "/tmp/project",
      title: "First",
      time: { created: 1, updated: 2 },
      summary: { files: 1, additions: 2, deletions: 0 },
    },
  ])
  const storeSessionListCache = mock.fn(async () => undefined)
  const tool = createOpencodeSessionsListTool(createApi() as never, {
    sessionKey: "agent:main:main",
  }, {
    listSessions,
    storeSessionListCache,
  })

  const result = await tool.execute("tool-call-1", {
    directory: "/tmp/project",
    limit: 5,
  })

  assert.equal(listSessions.mock.callCount(), 1)
  assert.equal(firstCallArgument(listSessions, 0), "/tmp/project")
  assert.deepEqual(firstCallArgument(listSessions, 1), { baseUrl: "http://127.0.0.1:4096", limit: 5 })
  assert.equal(storeSessionListCache.mock.callCount(), 1)
  assert.match((result as { content: Array<{ text: string }> }).content[0]!.text, /1\. First \[ses_123\]/)
  assert.equal((result as { details: { sessions: Array<{ id: string }> } }).details.sessions[0]!.id, "ses_123")
})

test("session attach tool resolves selection from the current chat cache", async () => {
  const getSession = mock.fn(async () => ({
    id: "ses_123",
    directory: "/tmp/project",
    title: "First",
    time: { created: 1, updated: 2 },
      summary: { files: 1, additions: 2, deletions: 0 },
  }))
  const attachSessionMapping = mock.fn(async () => undefined)
  const loadSessionListCache = mock.fn(async () => ({
    "agent:main:main": {
      directory: "/tmp/project",
      sessionIds: ["ses_123"],
      updatedAt: 1,
    },
  }))
  const tool = createOpencodeSessionAttachTool(createApi() as never, {
    sessionKey: "agent:main:main",
    messageChannel: "feishu",
  }, {
    getSession,
    attachSessionMapping,
    loadSessionListCache,
  })

  const result = await tool.execute("tool-call-1", {
    selection: 1,
    directory: "/tmp/project",
  })

  assert.equal(getSession.mock.callCount(), 1)
  assert.equal(firstCallArgument(getSession, 0), "ses_123")
  assert.equal(attachSessionMapping.mock.callCount(), 1)
  assert.deepEqual(firstCallArgument(attachSessionMapping, 1), {
    conversationId: "agent:main:main",
    userId: "feishu",
    directory: "/tmp/project",
  })
  assert.match((result as { content: Array<{ text: string }> }).content[0]!.text, /Attached OpenCode session ses_123/)
})
