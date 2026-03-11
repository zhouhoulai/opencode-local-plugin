import path from "node:path"

export type LocalOpencodeConfig = {
  baseUrl: string
  sessionStorePath: string
}

export function resolveLocalOpencodeConfig(cwd: string = process.cwd()): LocalOpencodeConfig {
  return {
    baseUrl: process.env.OPENCODE_BASE_URL ?? "http://127.0.0.1:4096",
    sessionStorePath:
      process.env.OPENCODE_SESSION_STORE_PATH ?? path.join(cwd, "data", "opencode-local", "session-map.json"),
  }
}
