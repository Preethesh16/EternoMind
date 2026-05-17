import { apiFetch } from './client'

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

export async function createSession(userId: string): Promise<Session> {
  return apiFetch<Session>('/api/v1/sessions', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/v1/sessions/${sessionId}`)
}
