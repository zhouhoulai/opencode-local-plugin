import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type SessionStoreEntry = {
  sessionId: string
  updatedAt: number
}

export type SessionStore = Record<string, SessionStoreEntry>

export type SessionKeyInput = {
  conversationId: string
  userId: string
  directory: string
}

export function createSessionKey(input: SessionKeyInput): string {
  return `${input.conversationId}:${input.userId}:${input.directory}`
}

export async function loadSessionStore(filePath: string): Promise<SessionStore> {
  try {
    const raw = await readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as SessionStore
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {}
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid session store JSON at ${filePath}`)
    }
    throw error
  }
}

export function getSessionMapping(store: SessionStore, key: string): SessionStoreEntry | undefined {
  return store[key]
}

export async function upsertSessionMapping(filePath: string, key: string, value: SessionStoreEntry): Promise<void> {
  const store = await loadSessionStore(filePath)
  store[key] = value
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(store, null, 2), "utf8")
}
