import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export type SessionStoreEntry = {
  sessionId: string
  updatedAt: number
}

export type SessionStore = Record<string, SessionStoreEntry>

export type SessionListCacheEntry = {
  directory: string
  sessionIds: string[]
  updatedAt: number
}

export type SessionListCache = Record<string, SessionListCacheEntry>

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

async function loadJsonFile<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON at ${filePath}`)
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

export async function attachSessionMapping(
  filePath: string,
  input: SessionKeyInput,
  sessionId: string,
): Promise<void> {
  await upsertSessionMapping(filePath, createSessionKey(input), {
    sessionId,
    updatedAt: Date.now(),
  })
}

export async function loadSessionListCache(filePath: string): Promise<SessionListCache> {
  return (await loadJsonFile<SessionListCache>(filePath)) ?? {}
}

export async function storeSessionListCache(
  filePath: string,
  key: string,
  value: SessionListCacheEntry,
): Promise<void> {
  const cache = await loadSessionListCache(filePath)
  cache[key] = value
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(cache, null, 2), "utf8")
}

export function getSessionListSelection(
  cache: SessionListCache,
  key: string,
  selection: number,
): string | undefined {
  const entry = cache[key]
  if (!entry) return undefined
  return entry.sessionIds[selection - 1]
}
