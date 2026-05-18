import { apiFetch, getAuthHeaders } from './client'

export interface Session {
  session_id: string
  created_at: string
}

export interface SessionDetail {
  session_id: string
  user_id: string
  created_at: string
  interaction_count: number
}

export async function createSession(userId: string, accessToken: string | null = null): Promise<Session> {
  return apiFetch<Session>('/api/v1/sessions', {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function getSession(sessionId: string, accessToken: string | null = null): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/v1/sessions/${sessionId}`, {
    headers: getAuthHeaders(accessToken),
  })
}
