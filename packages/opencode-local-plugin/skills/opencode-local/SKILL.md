---
name: opencode-local
description: Use when a request should be executed by the local OpenCode server in a workspace and the final plain-text result should be returned to the chat.
metadata: {"openclaw":{"emoji":"🧠"}}
---

# OpenCode Local

Use the `opencode_execute` tool when the user wants local code assistance to run through the machine's OpenCode server.

Pass:

- `conversationId`: stable chat or thread id
- `userId`: stable sender id
- `text`: the exact instruction for OpenCode
- `directory`: target workspace path when it differs from the agent workspace

Behavior notes:

- The tool reuses the same OpenCode session for the same `conversationId + userId + directory`.
- Omit `directory` to use the current agent workspace.
- Return the tool's final plain-text output directly unless the user asked for extra formatting.
