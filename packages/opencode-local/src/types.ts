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
