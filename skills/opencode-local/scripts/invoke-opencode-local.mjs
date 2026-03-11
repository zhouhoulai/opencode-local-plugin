#!/usr/bin/env node

import { tsImport } from "tsx/esm/api"

function printHelp() {
  console.log(`Usage:
  node skills/opencode-local/scripts/invoke-opencode-local.mjs \\
    --conversation-id "<conversationId>" \\
    --user-id "<userId>" \\
    --directory "<directory>" \\
    --text "<text>"`)
}

function parseArgs(argv) {
  const parsed = {}

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i]
    const next = argv[i + 1]

    if (current === "--help" || current === "-h") {
      parsed.help = "true"
      continue
    }

    if (!current.startsWith("--")) continue
    if (next == null || next.startsWith("--")) {
      throw new Error(`Missing value for ${current}`)
    }

    parsed[current.slice(2)] = next
    i += 1
  }

  return parsed
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const conversationId = args["conversation-id"]
  const userId = args["user-id"]
  const directory = args.directory
  const text = args.text

  if (!conversationId || !userId || !directory || !text) {
    printHelp()
    throw new Error("Missing required arguments")
  }

  const { sendToOpencode } = await tsImport("../../../packages/opencode-local/src/index.ts", import.meta.url)
  const result = await sendToOpencode({
    conversationId,
    userId,
    directory,
    text,
  })

  process.stdout.write(result.reply + "\n")
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`opencode-local error: ${message}\n`)
  process.exitCode = 1
})
