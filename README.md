# OpenCode Local Plugin

This repository contains a single OpenClaw integration for driving a local OpenCode server.

## Contents

- `packages/opencode-local-plugin`
  OpenClaw plugin that exposes OpenCode-backed tools.
- `packages/opencode-local`
  Local client, session mapping, and polling logic shared by the plugin.
- `packages/opencode-local-installer`
  npm installer package that assembles a ready-to-copy OpenClaw extension.

## Exposed Tools

- `opencode_execute`
  Send a prompt into the current OpenCode session for the current chat.
- `opencode_sessions_list`
  List recent OpenCode sessions for a workspace as a numbered list.
- `opencode_session_attach`
  Attach the current chat to a listed OpenCode session by selection.

## Prerequisites

1. Install and configure `opencode` so it can talk to your model.
2. Start OpenCode locally:

```bash
opencode web --hostname 127.0.0.1 --port 4096
```

3. Install OpenClaw and make sure it loads plugins from `~/.openclaw/extensions`.

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run typecheck:

```bash
npm run typecheck
```

## Runtime Install

Recommended install command:

```bash
npx @zhouhoulai/opencode-local-installer install
```

This writes the runtime extension into:

```text
~/.openclaw/extensions/opencode-local-plugin
```

The bundled runtime template shipped for npm distribution lives at:

```text
packages/opencode-local-installer/template/opencode-local-plugin
```

If you want to install manually, copy or sync the assembled extension into:

```text
~/.openclaw/extensions/opencode-local-plugin
```

The plugin manifest is:

```text
packages/opencode-local-plugin/openclaw.plugin.json
```

The bundled skill prompt used by the plugin lives at:

```text
packages/opencode-local-plugin/skills/opencode-local/SKILL.md
```

## Configuration

The plugin supports these config keys through OpenClaw:

- `enabled`
- `baseUrl`
- `sessionStorePath`
- `defaultDirectory`

Default OpenCode base URL is `http://127.0.0.1:4096`.
