export type SendToOpencodeInput = {
  conversationId: string
  userId: string
  text: string
  directory: string
}

export type SendToOpencodeResult = {
  sessionId: string
  reply: string
}

export type ListOpencodeSessionsInput = {
  directory: string
  limit?: number
}

export type AttachOpencodeSessionInput = {
  conversationId: string
  userId: string
  directory: string
  sessionId: string
}
