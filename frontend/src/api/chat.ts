import { API_BASE } from './client'

export interface ChatRequest {
  session_id: string
  message: string
  user_id: string
}

export type SSEEvent =
  | { event: 'pipeline_step'; data: { step: string; status: 'running' }; token_delta: '' }
  | { event: 'token'; data: { step: 'response'; token_delta: string }; token_delta: string }
  | {
      event: 'done'
      data: {
        total_tokens: number
        model: string
        latency_ms: number
        memory_hits: number
        response_text?: string
        optimized_prompt?: string
        prompt_goal?: string
        complexity_score?: number
        token_estimate?: number
        safety_score?: number
        estimated_cost?: number
      }
      token_delta: ''
    }
  | { event: 'error'; data: { step: string; message: string }; token_delta: '' }

/**
 * Opens a POST SSE stream to /api/v1/chat.
 * Uses fetch + ReadableStream because native EventSource only supports GET.
 *
 * @param request  Chat request payload
 * @param onEvent  Callback for each parsed SSE event
 * @param signal   AbortSignal to cancel the stream
 */
export async function streamChat(
  request: ChatRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Chat request failed')
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by double newline
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (!part.trim()) continue
      const lines = part.split('\n')
      let eventName = ''
      let dataStr = ''

      for (const line of lines) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        if (line.startsWith('data:')) dataStr = line.slice(5).trim()
      }

      if (eventName && dataStr) {
        try {
          const data = JSON.parse(dataStr)
          onEvent({ event: eventName, data, token_delta: data.token_delta ?? '' } as SSEEvent)
        } catch {
          // malformed event — skip
        }
      }
    }
  }
}
