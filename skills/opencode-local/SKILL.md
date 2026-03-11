# opencode-local

Use this skill when a message should be executed by a local OpenCode server running on the same machine.

## Purpose

This skill forwards a plain-text request to local OpenCode, reuses the same OpenCode session for the same conversation, and returns the final assistant reply as plain text.

## Use When

- OpenClaw has already received a Feishu text message
- The task should run against a local code workspace
- Local OpenCode is already available on `127.0.0.1:4096`
- A plain-text final result is sufficient

## Inputs

Provide these values to the script:

- `conversationId`
- `userId`
- `text`
- `directory`

## Execution

Run:

```bash
node skills/opencode-local/scripts/invoke-opencode-local.mjs \
  --conversation-id "<conversationId>" \
  --user-id "<userId>" \
  --directory "<directory>" \
  --text "<text>"
```

## Output

- On success: print only the final assistant reply to stdout
- On failure: print a concise error to stderr and exit non-zero

## Constraints

- Local-only V1 integration
- No streaming output
- No approval workflow
- No remote OpenCode hosts
