import { apiFetch } from './client'
import type { Interaction } from '../stores/metricsStore'

export interface MetricsResponse {
  session_id: string
  interactions: Interaction[]
}

export async function getMetrics(sessionId: string, accessToken: string): Promise<MetricsResponse> {
  return apiFetch<MetricsResponse>(`/api/v1/metrics/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
