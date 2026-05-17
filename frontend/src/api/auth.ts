import { apiFetch } from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password } satisfies LoginRequest),
  })
}

export async function refreshToken(refreshToken: string): Promise<{ access_token: string; token_type: string }> {
  return apiFetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })
}

export async function logout(accessToken: string): Promise<void> {
  await apiFetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
