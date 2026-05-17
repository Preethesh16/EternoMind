// Central API base URL — set VITE_API_URL in .env to override (e.g. in Docker)
export const API_BASE = import.meta.env.VITE_API_URL ?? ''

// Shared fetch helper with JSON response handling
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}
