---
name: opencode-local
description: Use when a request should be executed by the local OpenCode server in a workspace and the final plain-text result should be returned to the chat.
metadata: {"openclaw":{"emoji":"🧠"}}
---

# OpenCode Local

Use the OpenCode tools when the user wants local code assistance to run through the machine's OpenCode server.

Tool selection:

- Use `opencode_execute` to send a fresh instruction into the mapped OpenCode session.
- Use `opencode_sessions_list` when the user wants to inspect or pick from existing OpenCode sessions in a workspace.
- Use `opencode_session_attach` when the user names or chooses an existing `sessionId` and wants future `opencode_execute` calls to reuse it.

Pass:

- `conversationId`: stable chat or thread id
- `userId`: stable sender id
- `text`: the exact instruction for OpenCode when using `opencode_execute`
- `directory`: target workspace path when it differs from the agent workspace
- `sessionId`: existing OpenCode session id when using `opencode_session_attach`
- `limit`: optional max number of sessions when using `opencode_sessions_list`

Behavior notes:

- The tool reuses the same OpenCode session for the same `conversationId + userId + directory`.
- `opencode_sessions_list` returns recent sessions for the selected workspace directory.
- `opencode_session_attach` validates the target session before storing the mapping.
- Omit `directory` to use the current agent workspace.
- Return the tool's final plain-text output directly unless the user asked for extra formatting.
