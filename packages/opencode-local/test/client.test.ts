import test, { mock } from "node:test"
import assert from "node:assert/strict"

import { createSession, getSession, listMessages, listSessions, sendMessage } from "../src/client.js"

test("createSession posts to /session", async () => {
  const restore = mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "http://127.0.0.1:4096/session")
    assert.equal(init?.method, "POST")
    assert.equal(
      new Headers(init?.headers).get("x-opencode-directory"),
      encodeURIComponent("/tmp/project"),
    )
    return new Response(JSON.stringify({ id: "ses_123" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })

  const result = await createSession("http://127.0.0.1:4096", "/tmp/project")
  assert.equal(result.id, "ses_123")
  restore.mock.restore()
})

test("sendMessage posts prompt parts to /session/:id/message", async () => {
  const restore = mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "http://127.0.0.1:4096/session/ses_123/message")
    assert.equal(init?.method, "POST")
    assert.equal(
      new Headers(init?.headers).get("x-opencode-directory"),
      encodeURIComponent("/tmp/project"),
    )
    assert.match(String(init?.body), /"text":"hello"/)
    return new Response(JSON.stringify({ info: { id: "msg_1" }, parts: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })

  const result = await sendMessage("http://127.0.0.1:4096", "ses_123", "hello", "/tmp/project")
  assert.equal(result.info.id, "msg_1")
  restore.mock.restore()
})

test("listMessages fetches /session/:id/message", async () => {
  const restore = mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "http://127.0.0.1:4096/session/ses_123/message")
    assert.equal(init?.method, "GET")
    assert.equal(
      new Headers(init?.headers).get("x-opencode-directory"),
      encodeURIComponent("/tmp/project"),
    )
    return new Response(JSON.stringify([{ info: { id: "msg_1", role: "assistant" }, parts: [] }]), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })

  const result = await listMessages("http://127.0.0.1:4096", "ses_123", "/tmp/project")
  assert.equal(result[0]?.info.role, "assistant")
  restore.mock.restore()
})

test("client surfaces HTTP status and body on failure", async () => {
  const restore = mock.method(globalThis, "fetch", async () => {
    return new Response("bad request", { status: 400 })
  })

  await assert.rejects(
    () => createSession("http://127.0.0.1:4096"),
    /OpenCode request failed \(400\): bad request/,
  )
  restore.mock.restore()
})

test("listSessions fetches /session with a limit", async () => {
  const restore = mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "http://127.0.0.1:4096/session?limit=5")
    assert.equal(init?.method, "GET")
    assert.equal(
      new Headers(init?.headers).get("x-opencode-directory"),
      encodeURIComponent("/tmp/project"),
    )
    return new Response(JSON.stringify([
      {
        id: "ses_123",
        directory: "/tmp/project",
        title: "First",
        time: { created: 1, updated: 2 },
        summary: { files: 1, additions: 2, deletions: 0 },
      },
    ]), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })

  const result = await listSessions("http://127.0.0.1:4096", "/tmp/project", 5)
  assert.equal(result[0]?.id, "ses_123")
  restore.mock.restore()
})

test("getSession fetches /session/:id", async () => {
  const restore = mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(input), "http://127.0.0.1:4096/session/ses_123")
    assert.equal(init?.method, "GET")
    assert.equal(
      new Headers(init?.headers).get("x-opencode-directory"),
      encodeURIComponent("/tmp/project"),
    )
    return new Response(JSON.stringify({
      id: "ses_123",
      directory: "/tmp/project",
      title: "First",
      time: { created: 1, updated: 2 },
      summary: { files: 1, additions: 2, deletions: 0 },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  })

  const result = await getSession("http://127.0.0.1:4096", "ses_123", "/tmp/project")
  assert.equal(result.id, "ses_123")
  assert.equal(result.title, "First")
  restore.mock.restore()
})
