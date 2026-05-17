import { useCallback } from 'react'
import { getMetrics } from '../api/metrics'
import { useMetricsStore } from '../stores/metricsStore'
import { useSessionStore } from '../stores/sessionStore'

export function useMetrics() {
  const sessionId = useSessionStore((s) => s.sessionId)
  const setInteractions = useMetricsStore((s) => s.setInteractions)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    try {
      const data = await getMetrics(sessionId)
      setInteractions(data.interactions)
    } catch {
      // metrics fetch failing should not crash the UI
    }
  }, [sessionId, setInteractions])

  return { refresh }
}
