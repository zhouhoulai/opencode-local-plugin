import { createSession, listMessages, sendMessage, type OpencodeMessage, type OpencodeSession } from "./client.js"
import { resolveLocalOpencodeConfig, type LocalOpencodeConfig } from "./config.js"
import { createSessionKey, getSessionMapping, loadSessionStore, upsertSessionMapping } from "./session-store.js"
import type { SendToOpencodeInput, SendToOpencodeResult } from "./types.js"

type SendDependencies = {
  createSession: (baseUrl: string, directory?: string) => Promise<OpencodeSession>
  sendMessage: (baseUrl: string, sessionId: string, text: string, directory?: string) => Promise<OpencodeMessage>
  listMessages: (baseUrl: string, sessionId: string, directory?: string) => Promise<OpencodeMessage[]>
}

type SendOptions = LocalOpencodeConfig & {
  pollIntervalMs?: number
  maxPollAttempts?: number
}

const defaultDependencies: SendDependencies = {
  createSession,
  sendMessage,
  listMessages,
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractReply(message: OpencodeMessage | undefined): string | undefined {
  if (!message) return undefined
  const chunks = message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string" && part.text.trim().length > 0)
    .map((part) => part.text!.trim())

  if (chunks.length === 0) return undefined
  return chunks.join("\n\n")
}

function lastAssistantMessage(messages: OpencodeMessage[]): OpencodeMessage | undefined {
  return [...messages].reverse().find((message) => message.info.role === "assistant")
}

export async function sendToOpencode(
  input: SendToOpencodeInput,
  options?: Partial<SendOptions>,
  dependencies: SendDependencies = defaultDependencies,
): Promise<SendToOpencodeResult> {
  const defaults = resolveLocalOpencodeConfig()
  const resolved = {
    baseUrl: options?.baseUrl ?? defaults.baseUrl,
    sessionStorePath: options?.sessionStorePath ?? defaults.sessionStorePath,
    pollIntervalMs: options?.pollIntervalMs ?? 250,
    maxPollAttempts: options?.maxPollAttempts ?? 20,
  }

  const sessionKey = createSessionKey(input)
  const store = await loadSessionStore(resolved.sessionStorePath)
  const existing = getSessionMapping(store, sessionKey)
  const sessionId = existing?.sessionId ?? (await dependencies.createSession(resolved.baseUrl, input.directory)).id

  const message = await dependencies.sendMessage(resolved.baseUrl, sessionId, input.text, input.directory)
  const immediateReply = extractReply(message)

  if (immediateReply) {
    await upsertSessionMapping(resolved.sessionStorePath, sessionKey, {
      sessionId,
      updatedAt: Date.now(),
    })
    return {
      sessionId,
      reply: immediateReply,
    }
  }

  for (let attempt = 0; attempt < resolved.maxPollAttempts; attempt += 1) {
    const messages = await dependencies.listMessages(resolved.baseUrl, sessionId, input.directory)
    const reply = extractReply(lastAssistantMessage(messages))
    if (reply) {
      await upsertSessionMapping(resolved.sessionStorePath, sessionKey, {
        sessionId,
        updatedAt: Date.now(),
      })
      return {
        sessionId,
        reply,
      }
    }
    await sleep(resolved.pollIntervalMs)
  }

  throw new Error("Timed out waiting for final assistant reply")
}
