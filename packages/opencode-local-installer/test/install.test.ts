import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { installExtension } from "../src/install.js"

async function exists(filePath: string) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

test("installExtension assembles a runtime plugin directory", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-local-installer-"))
  const targetRoot = path.join(tempDir, "extensions")

  const result = await installExtension({
    repoRoot: path.resolve(process.cwd()),
    targetRoot,
  })

  assert.equal(result.targetDir, path.join(targetRoot, "opencode-local-plugin"))
  assert.equal(await exists(path.join(result.targetDir, "openclaw.plugin.json")), true)
  assert.equal(await exists(path.join(result.targetDir, "index.ts")), true)
  assert.equal(await exists(path.join(result.targetDir, "src", "plugin.ts")), true)
  assert.equal(await exists(path.join(result.targetDir, "skills", "opencode-local", "SKILL.md")), true)
  assert.equal(await exists(path.join(result.targetDir, "vendor", "opencode-local", "src", "index.ts")), true)
  assert.equal(await exists(path.join(result.targetDir, "vendor", "opencode-local", "package.json")), true)
})

test("installExtension replaces an existing target directory", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-local-installer-"))
  const targetRoot = path.join(tempDir, "extensions")
  const dirtyTarget = path.join(targetRoot, "opencode-local-plugin")

  await fs.mkdir(dirtyTarget, { recursive: true })
  await fs.writeFile(path.join(dirtyTarget, "stale.txt"), "old")

  const result = await installExtension({
    repoRoot: path.resolve(process.cwd()),
    targetRoot,
  })

  assert.equal(await exists(path.join(result.targetDir, "stale.txt")), false)
  assert.equal(await exists(path.join(result.targetDir, "openclaw.plugin.json")), true)
})

test("installExtension can use the installer package's bundled template", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-local-installer-"))
  const targetRoot = path.join(tempDir, "extensions")

  const result = await installExtension({
    repoRoot: path.join(tempDir, "missing-repo-root"),
    targetRoot,
  })

  assert.equal(await exists(path.join(result.targetDir, "openclaw.plugin.json")), true)
  assert.equal(await exists(path.join(result.targetDir, "vendor", "opencode-local", "src", "send.ts")), true)
})
