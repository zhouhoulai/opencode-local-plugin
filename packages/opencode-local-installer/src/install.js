import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PLUGIN_DIRNAME = "opencode-local-plugin"

function resolvePackageRoot() {
  const currentFile = fileURLToPath(import.meta.url)
  return path.resolve(path.dirname(currentFile), "..")
}

function resolveDefaultRepoRoot() {
  return path.resolve(resolvePackageRoot(), "../..")
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolveSourceTree(repoRoot) {
  const pluginSource = path.join(repoRoot, "packages", "opencode-local-plugin")
  const localSource = path.join(repoRoot, "packages", "opencode-local")

  if (await pathExists(path.join(pluginSource, "openclaw.plugin.json"))) {
    return {
      mode: "repo",
      pluginSource,
      localSource,
    }
  }

  return {
    mode: "template",
    templateSource: path.join(resolvePackageRoot(), "template", PLUGIN_DIRNAME),
  }
}

async function ensureCleanDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true })
  await fs.mkdir(dirPath, { recursive: true })
}

async function copyRequiredFiles(sourceDir, targetDir, names) {
  await fs.mkdir(targetDir, { recursive: true })
  await Promise.all(
    names.map(async (name) => {
      await fs.cp(path.join(sourceDir, name), path.join(targetDir, name), { recursive: true })
    }),
  )
}

export async function installExtension(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? resolveDefaultRepoRoot())
  const targetRoot = path.resolve(options.targetRoot ?? path.join(os.homedir(), ".openclaw", "extensions"))
  const targetDir = path.join(targetRoot, PLUGIN_DIRNAME)
  const stagingDir = path.join(targetRoot, `.${PLUGIN_DIRNAME}.tmp`)
  const sourceTree = await resolveSourceTree(repoRoot)

  await fs.mkdir(targetRoot, { recursive: true })
  await ensureCleanDir(stagingDir)

  if (sourceTree.mode === "repo") {
    await copyRequiredFiles(sourceTree.pluginSource, stagingDir, [
      "index.ts",
      "openclaw.plugin.json",
      "package.json",
      "src",
      "skills",
    ])

    await copyRequiredFiles(sourceTree.localSource, path.join(stagingDir, "vendor", "opencode-local"), [
      "package.json",
      "src",
    ])
  } else {
    await fs.cp(sourceTree.templateSource, stagingDir, { recursive: true })
  }

  await fs.rm(targetDir, { recursive: true, force: true })
  await fs.rename(stagingDir, targetDir)

  return { targetDir }
}
