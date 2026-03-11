import test, { mock } from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { mkdtemp } from "node:fs/promises"

import { sendToOpencode } from "../src/send.js"

test("sendToOpencode creates a session when mapping is missing", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-send-"))
  const sessionStorePath = path.join(tempDir, "session-map.json")

  const createSessionMock = mock.fn(async () => ({ id: "ses_123" }))
  const sendMessageMock = mock.fn(async () => ({
    info: { id: "msg_1", role: "assistant" },
    parts: [{ type: "text", text: "done" }],
  }))
  const listMessagesMock = mock.fn(async () => [])

  const result = await sendToOpencode(
    {
      conversationId: "chat-1",
      userId: "user-1",
      text: "hello",
      directory: "/tmp/project",
    },
    {
      baseUrl: "http://127.0.0.1:4096",
      sessionStorePath,
      pollIntervalMs: 1,
      maxPollAttempts: 2,
    },
    {
      createSession: createSessionMock,
      sendMessage: sendMessageMock,
      listMessages: listMessagesMock,
    },
  )

  assert.equal(result.sessionId, "ses_123")
  assert.equal(result.reply, "done")
  assert.equal(createSessionMock.mock.callCount(), 1)
})

test("sendToOpencode reuses an existing session mapping", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-send-"))
  const sessionStorePath = path.join(tempDir, "session-map.json")

  await sendToOpencode(
    {
      conversationId: "chat-1",
      userId: "user-1",
      text: "first",
      directory: "/tmp/project",
    },
    {
      baseUrl: "http://127.0.0.1:4096",
      sessionStorePath,
      pollIntervalMs: 1,
      maxPollAttempts: 2,
    },
    {
      createSession: async () => ({ id: "ses_123" }),
      sendMessage: async () => ({
        info: { id: "msg_1", role: "assistant" },
        parts: [{ type: "text", text: "first reply" }],
      }),
      listMessages: async () => [],
    },
  )

  const createSessionMock = mock.fn(async () => ({ id: "ses_other" }))
  const result = await sendToOpencode(
    {
      conversationId: "chat-1",
      userId: "user-1",
      text: "second",
      directory: "/tmp/project",
    },
    {
      baseUrl: "http://127.0.0.1:4096",
      sessionStorePath,
      pollIntervalMs: 1,
      maxPollAttempts: 2,
    },
    {
      createSession: createSessionMock,
      sendMessage: async (_baseUrl, sessionId) => ({
        info: { id: "msg_2", role: "assistant" },
        parts: [{ type: "text", text: `reply from ${sessionId}` }],
      }),
      listMessages: async () => [],
    },
  )

  assert.equal(result.sessionId, "ses_123")
  assert.equal(result.reply, "reply from ses_123")
  assert.equal(createSessionMock.mock.callCount(), 0)
})

test("sendToOpencode polls messages when send result has no final text", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-send-"))
  const sessionStorePath = path.join(tempDir, "session-map.json")

  let polls = 0
  const result = await sendToOpencode(
    {
      conversationId: "chat-1",
      userId: "user-1",
      text: "hello",
      directory: "/tmp/project",
    },
    {
      baseUrl: "http://127.0.0.1:4096",
      sessionStorePath,
      pollIntervalMs: 1,
      maxPollAttempts: 5,
    },
    {
      createSession: async () => ({ id: "ses_123" }),
      sendMessage: async () => ({
        info: { id: "msg_1", role: "assistant" },
        parts: [],
      }),
      listMessages: async () => {
        polls += 1
        if (polls < 2) return [{ info: { id: "msg_1", role: "assistant" }, parts: [] }]
        return [{ info: { id: "msg_1", role: "assistant" }, parts: [{ type: "text", text: "done later" }] }]
      },
    },
  )

  assert.equal(result.reply, "done later")
})

test("sendToOpencode times out when no final reply appears", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-send-"))
  const sessionStorePath = path.join(tempDir, "session-map.json")

  await assert.rejects(
    () =>
      sendToOpencode(
        {
          conversationId: "chat-1",
          userId: "user-1",
          text: "hello",
          directory: "/tmp/project",
        },
        {
          baseUrl: "http://127.0.0.1:4096",
          sessionStorePath,
          pollIntervalMs: 1,
          maxPollAttempts: 2,
        },
        {
          createSession: async () => ({ id: "ses_123" }),
          sendMessage: async () => ({
            info: { id: "msg_1", role: "assistant" },
            parts: [],
          }),
          listMessages: async () => [{ info: { id: "msg_1", role: "assistant" }, parts: [] }],
        },
      ),
    /Timed out waiting for final assistant reply/,
  )
})

test("sendToOpencode ignores undefined option overrides and keeps default paths", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-send-defaults-"))
  const originalCwd = process.cwd()
  const createSessionMock = mock.fn(async () => ({ id: "ses_123" }))
  const sendMessageMock = mock.fn(async () => ({
    info: { id: "msg_1", role: "assistant" },
    parts: [{ type: "text", text: "done" }],
  }))
  process.chdir(tempDir)

  try {
    const result = await sendToOpencode(
      {
        conversationId: "chat-1",
        userId: "user-1",
        text: "hello",
        directory: "/tmp/project",
      },
      {
        baseUrl: undefined,
        sessionStorePath: undefined,
        pollIntervalMs: 1,
        maxPollAttempts: 2,
      },
      {
        createSession: createSessionMock,
        sendMessage: sendMessageMock,
        listMessages: async () => [],
      },
    )

    assert.equal(result.reply, "done")
    assert.equal(createSessionMock.mock.callCount(), 1)
  } finally {
    process.chdir(originalCwd)
  }
})
