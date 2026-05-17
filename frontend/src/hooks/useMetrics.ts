import { useCallback } from 'react'
import { getMetrics } from '../api/metrics'
import { useMetricsStore } from '../stores/metricsStore'
import { useSessionStore } from '../stores/sessionStore'

export function useMetrics() {
  const sessionId = useSessionStore((s) => s.sessionId)
  const accessToken = useSessionStore((s) => s.accessToken)
  const setInteractions = useMetricsStore((s) => s.setInteractions)

  const refresh = useCallback(async () => {
    if (!sessionId || !accessToken) return
    try {
      const data = await getMetrics(sessionId, accessToken)
      setInteractions(data.interactions)
    } catch {
      // metrics fetch failing should not crash the UI
    }
  }, [sessionId, accessToken, setInteractions])

  return { refresh }
}
