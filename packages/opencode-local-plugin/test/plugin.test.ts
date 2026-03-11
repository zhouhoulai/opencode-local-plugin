import test, { mock } from "node:test"
import assert from "node:assert/strict"

import registerPlugin, { createOpencodeExecuteTool } from "../src/index.js"

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

  assert.equal(api.registerTool.mock.callCount(), 1)
  const tool = firstCallArgument(api.registerTool, 0) as { name: string }
  const options = firstCallArgument(api.registerTool, 1) as { optional?: boolean } | undefined
  assert.equal(tool.name, "opencode_execute")
  assert.equal(options?.optional, true)
})

test("tool sends the request to opencode and returns text content", async () => {
  const sendToOpencode = mock.fn(async () => ({
    sessionId: "ses_123",
    reply: "done",
  }))
  const tool = createOpencodeExecuteTool(createApi() as never, {
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
  const tool = createOpencodeExecuteTool(createApi() as never, {
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
  const tool = createOpencodeExecuteTool(createApi() as never, {
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
