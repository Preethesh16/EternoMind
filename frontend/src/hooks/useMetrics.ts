import { useCallback } from 'react'
import { API_BASE, getAuthHeaders } from '../api/client'
import { useMetricsStore } from '../stores/metricsStore'
import { useSessionStore } from '../stores/sessionStore'
import type { MetricsResponse } from '../api/metrics'

export function useMetrics() {
  const sessionId = useSessionStore((s) => s.sessionId)
  const accessToken = useSessionStore((s) => s.accessToken)
  const setInteractions = useMetricsStore((s) => s.setInteractions)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`${API_BASE}/api/v1/metrics/${sessionId}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders(accessToken) },
      })
      if (!res.ok) return
      const data = (await res.json()) as MetricsResponse
      setInteractions(data.interactions)
    } catch {
      // metrics fetch failing should not crash the UI
    }
  }, [sessionId, accessToken, setInteractions])

  return { refresh }
}
