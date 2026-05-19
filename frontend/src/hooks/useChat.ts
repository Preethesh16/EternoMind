import { useRef, useCallback } from 'react'
import { API_BASE } from '../api/client'
import type { SSEEvent } from '../api/chat'
import { useChatStore } from '../stores/chatStore'
import { useMetricsStore } from '../stores/metricsStore'
import { useSessionStore } from '../stores/sessionStore'
import { useMetrics } from './useMetrics'

export function useChat() {
  const abortRef = useRef<AbortController | null>(null)

  const sessionId = useSessionStore((s) => s.sessionId)
  const userId = useSessionStore((s) => s.userId)
  const accessToken = useSessionStore((s) => s.accessToken)

  const addUserMessage = useChatStore((s) => s.addUserMessage)
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage)
  const appendToken = useChatStore((s) => s.appendToken)
  const finalizeMessage = useChatStore((s) => s.finalizeMessage)
  const setPipelineStep = useChatStore((s) => s.setPipelineStep)
  const addInteraction = useMetricsStore((s) => s.addInteraction)

  const { refresh: refreshMetrics } = useMetrics()

  const sendMessage = useCallback(
    async (content: string, onError?: (msg: string) => void) => {
      if (!sessionId || !userId) {
        onError?.('No active session. Please sign out and sign back in.')
        return
      }

      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      addUserMessage(content)
      const assistantId = startAssistantMessage()

      try {
        const res = await fetch(`${API_BASE}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ session_id: sessionId, message: content, user_id: userId }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ detail: res.statusText }))
          const detail = (errBody as { detail?: string }).detail ?? 'Chat request failed'
          // Map known backend errors to friendly messages
          if (res.status === 401) throw new Error('Your session expired. Please sign in again.')
          if (res.status === 429) throw new Error('Rate limited by Groq or backend. Wait a moment and try again.')
          if (res.status === 503) throw new Error('Backend is starting up. Try again in a few seconds.')
          throw new Error(detail)
        }

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
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

            if (!eventName || !dataStr) continue

            try {
              const data = JSON.parse(dataStr) as Record<string, unknown>
              const evt = { event: eventName, data, token_delta: (data.token_delta as string) ?? '' } as SSEEvent

              if (evt.event === 'pipeline_step') {
                setPipelineStep((evt.data as { step: string }).step)
              } else if (evt.event === 'token') {
                appendToken(assistantId, evt.token_delta)
              } else if (evt.event === 'done') {
                const d = evt.data as { 
                  total_tokens: number; 
                  model: string; 
                  latency_ms: number; 
                  memory_hits: number; 
                  response_text?: string;
                  optimized_prompt?: string;
                  prompt_goal?: string;
                  token_estimate?: number;
                }
                // If the message bubble is empty (no token events arrived),
                // fall back to displaying the full response_text from `done`.
                // This covers the case where the backend streams metadata but
                // not individual tokens (e.g., model returns response in one chunk).
                if (d.response_text) {
                  const current = useChatStore.getState().messages.find((m) => m.id === assistantId)
                  if (current && !current.content) {
                    appendToken(assistantId, d.response_text)
                  }
                }
                finalizeMessage(assistantId, {
                  total_tokens: d.total_tokens,
                  model: d.model,
                  latency_ms: d.latency_ms,
                  memory_hits: d.memory_hits,
                  optimized_prompt: d.optimized_prompt,
                  prompt_goal: d.prompt_goal,
                  token_estimate: d.token_estimate,
                })
                addInteraction({
                  interaction_number: 0,
                  token_count_input: d.total_tokens,
                  token_count_output: 0,
                  model_used: d.model,
                  memory_hits: d.memory_hits,
                  latency_ms: d.latency_ms,
                })
                void refreshMetrics()
              } else if (evt.event === 'error') {
                const e = evt.data as { message: string }
                onError?.(e.message)
                finalizeMessage(assistantId, { total_tokens: 0, model: '', latency_ms: 0, memory_hits: 0 })
              }
            } catch {
              // malformed event — skip
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          const raw = err instanceof Error ? err.message : 'Unknown error'
          // Network failure or backend offline
          if (raw.includes('Failed to fetch') || raw.includes('NetworkError') || raw.includes('ECONNREFUSED')) {
            onError?.('Could not connect to EternoMind backend. Is it running on port 8000?')
          } else {
            onError?.(raw)
          }
          finalizeMessage(assistantId, { total_tokens: 0, model: '', latency_ms: 0, memory_hits: 0 })
        }
      }
    },
    [sessionId, userId, accessToken, addUserMessage, startAssistantMessage, appendToken,
     finalizeMessage, setPipelineStep, addInteraction, refreshMetrics]
  )

  return { sendMessage }
}
