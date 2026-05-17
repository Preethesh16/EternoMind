import { create } from 'zustand'

interface SessionState {
  userId: string | null
  sessionId: string | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (userId: string, token: string) => void
  setSession: (sessionId: string) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  sessionId: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (userId, token) =>
    set({ userId, accessToken: token, isAuthenticated: true }),

  setSession: (sessionId) =>
    set({ sessionId }),

  logout: () =>
    set({ userId: null, sessionId: null, accessToken: null, isAuthenticated: false }),
}))
