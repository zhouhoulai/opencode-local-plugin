import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"
import { mkdtemp, writeFile } from "node:fs/promises"

import {
  attachSessionMapping,
  createSessionKey,
  loadSessionStore,
  upsertSessionMapping,
  getSessionMapping,
} from "../src/session-store.js"

test("createSessionKey builds a stable lookup key", () => {
  const key = createSessionKey({
    conversationId: "chat-1",
    userId: "user-1",
    directory: "/tmp/project",
  })

  assert.equal(key, "chat-1:user-1:/tmp/project")
})

test("upsertSessionMapping persists and reloads mappings", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-store-"))
  const filePath = path.join(tempDir, "session-map.json")
  const key = createSessionKey({
    conversationId: "chat-1",
    userId: "user-1",
    directory: "/tmp/project",
  })

  await upsertSessionMapping(filePath, key, {
    sessionId: "ses_123",
    updatedAt: 123,
  })

  const store = await loadSessionStore(filePath)
  const mapping = getSessionMapping(store, key)

  assert.deepEqual(mapping, {
    sessionId: "ses_123",
    updatedAt: 123,
  })
})

test("loadSessionStore throws for invalid JSON", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-store-"))
  const filePath = path.join(tempDir, "session-map.json")
  await writeFile(filePath, "{broken", "utf8")

  await assert.rejects(
    () => loadSessionStore(filePath),
    /Invalid session store JSON/,
  )
})

test("attachSessionMapping writes a mapping from session key input", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "opencode-local-store-"))
  const filePath = path.join(tempDir, "session-map.json")

  await attachSessionMapping(filePath, {
    conversationId: "chat-1",
    userId: "user-1",
    directory: "/tmp/project",
  }, "ses_attach")

  const store = await loadSessionStore(filePath)
  assert.equal(store["chat-1:user-1:/tmp/project"]?.sessionId, "ses_attach")
  assert.equal(typeof store["chat-1:user-1:/tmp/project"]?.updatedAt, "number")
})
