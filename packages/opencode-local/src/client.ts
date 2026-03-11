export type OpencodeSession = {
  id: string
}

export type OpencodeMessage = {
  info: {
    id: string
    role?: string
  }
  parts: Array<{
    type: string
    text?: string
  }>
}

function createHeaders(directory?: string, init?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  }

  if (directory) headers["x-opencode-directory"] = encodeURIComponent(directory)

  const incoming = init?.headers
  if (Array.isArray(incoming)) {
    for (const [key, value] of incoming) headers[key] = value
    return headers
  }

  if (incoming && typeof incoming === "object") {
    for (const [key, value] of Object.entries(incoming)) {
      if (typeof value === "string") headers[key] = value
    }
  }

  return headers
}

async function request<T>(url: string, init: RequestInit, directory?: string): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: createHeaders(directory, init),
  })

  if (!response.ok) {
    const body = (await response.text()).trim()
    throw new Error(`OpenCode request failed (${response.status}): ${body}`)
  }

  return (await response.json()) as T
}

export async function createSession(baseUrl: string, directory?: string): Promise<OpencodeSession> {
  return request<OpencodeSession>(`${baseUrl}/session`, {
    method: "POST",
    body: JSON.stringify({}),
  }, directory)
}

export async function sendMessage(
  baseUrl: string,
  sessionId: string,
  text: string,
  directory?: string,
): Promise<OpencodeMessage> {
  return request<OpencodeMessage>(`${baseUrl}/session/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({
      parts: [
        {
          type: "text",
          text,
        },
      ],
    }),
  }, directory)
}

export async function listMessages(baseUrl: string, sessionId: string, directory?: string): Promise<OpencodeMessage[]> {
  return request<OpencodeMessage[]>(`${baseUrl}/session/${sessionId}/message`, {
    method: "GET",
  }, directory)
}
