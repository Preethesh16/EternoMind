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

// Person 1's endpoint uses get_current_user — needs Authorization header
export async function createSession(accessToken: string): Promise<Session> {
  return apiFetch<Session>('/api/v1/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ user_id: '' }), // backend ignores this, uses JWT sub
  })
}

export async function getSession(sessionId: string, accessToken: string): Promise<SessionDetail> {
  return apiFetch<SessionDetail>(`/api/v1/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
