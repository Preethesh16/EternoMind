import { useRef, useCallback } from 'react'
import { streamChat } from '../api/chat'
import { useChatStore } from '../stores/chatStore'
import { useMetricsStore } from '../stores/metricsStore'
import { useSessionStore } from '../stores/sessionStore'
import { useMetrics } from './useMetrics'

export function useChat() {
  const abortRef = useRef<AbortController | null>(null)

  const sessionId = useSessionStore((s) => s.sessionId)
  const userId = useSessionStore((s) => s.userId)

  const addUserMessage = useChatStore((s) => s.addUserMessage)
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage)
  const appendToken = useChatStore((s) => s.appendToken)
  const finalizeMessage = useChatStore((s) => s.finalizeMessage)
  const setPipelineStep = useChatStore((s) => s.setPipelineStep)
  const addInteraction = useMetricsStore((s) => s.addInteraction)

  const { refresh: refreshMetrics } = useMetrics()

  const sendMessage = useCallback(
    async (content: string, onError?: (msg: string) => void) => {
      if (!sessionId || !userId) return

      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      addUserMessage(content)
      const assistantId = startAssistantMessage()

      try {
        await streamChat(
          { session_id: sessionId, message: content, user_id: userId },
          (evt) => {
            if (evt.event === 'pipeline_step') {
              setPipelineStep(evt.data.step)
            } else if (evt.event === 'token') {
              appendToken(assistantId, evt.token_delta)
            } else if (evt.event === 'done') {
              finalizeMessage(assistantId, {
                total_tokens: evt.data.total_tokens,
                model: evt.data.model,
                latency_ms: evt.data.latency_ms,
                memory_hits: evt.data.memory_hits,
              })
              addInteraction({
                interaction_number: 0, // will be replaced by refreshMetrics
                token_count_input: evt.data.total_tokens,
                token_count_output: 0,
                model_used: evt.data.model,
                memory_hits: evt.data.memory_hits,
                latency_ms: evt.data.latency_ms,
              })
              void refreshMetrics()
            } else if (evt.event === 'error') {
              onError?.(evt.data.message)
              finalizeMessage(assistantId, {
                total_tokens: 0,
                model: '',
                latency_ms: 0,
                memory_hits: 0,
              })
            }
          },
          abortRef.current.signal
        )
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          onError?.('Could not connect to EternoMind backend. Retrying...')
          finalizeMessage(assistantId, { total_tokens: 0, model: '', latency_ms: 0, memory_hits: 0 })
        }
      }
    },
    [sessionId, userId, addUserMessage, startAssistantMessage, appendToken,
     finalizeMessage, setPipelineStep, addInteraction, refreshMetrics]
  )

  return { sendMessage }
}
