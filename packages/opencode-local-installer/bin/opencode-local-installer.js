#!/usr/bin/env node

import os from "node:os"
import path from "node:path"

import { installExtension } from "../src/install.js"

function parseArgs(argv) {
  const args = argv.slice(2)
  const command = args[0]
  const options = {}

  for (let index = 1; index < args.length; index += 1) {
    const current = args[index]
    const next = args[index + 1]

    if (current === "--target-root" && next) {
      options.targetRoot = next
      index += 1
      continue
    }

    if (current === "--repo-root" && next) {
      options.repoRoot = next
      index += 1
      continue
    }
  }

  return { command, options }
}

async function main() {
  const { command, options } = parseArgs(process.argv)

  if (command !== "install") {
    console.error("Usage: opencode-local-installer install [--target-root PATH] [--repo-root PATH]")
    process.exitCode = 1
    return
  }

  const result = await installExtension({
    repoRoot: options.repoRoot,
    targetRoot: options.targetRoot ?? path.join(os.homedir(), ".openclaw", "extensions"),
  })

  console.log(`Installed OpenClaw plugin to ${result.targetDir}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
