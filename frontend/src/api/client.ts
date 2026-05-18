// Central API base URL — set VITE_API_URL in .env to override (e.g. in Docker)
export const API_BASE = import.meta.env.VITE_API_URL ?? ''

// Shared fetch helper with JSON response handling
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    // Headers must be merged AFTER options spread so Content-Type isn't overwritten
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

// Auth-aware fetch — injects Bearer token from sessionStore
export function getAuthHeaders(token: string | null): Record<string, string> {
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}
