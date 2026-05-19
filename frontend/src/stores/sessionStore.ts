import { create } from 'zustand'

interface SessionState {
  userId: string | null
  sessionId: string | null
  accessToken: string | null
  isAuthenticated: boolean
  selectedModel: string   // 'auto' or a specific model id
  setAuth: (userId: string, token: string) => void
  setSession: (sessionId: string) => void
  setSelectedModel: (model: string) => void
  logout: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  sessionId: null,
  accessToken: null,
  isAuthenticated: false,
  selectedModel: 'auto',

  setAuth: (userId, token) =>
    set({ userId, accessToken: token, isAuthenticated: true }),

  setSession: (sessionId) =>
    set({ sessionId }),

  setSelectedModel: (model) =>
    set({ selectedModel: model }),

  logout: () =>
    set({ userId: null, sessionId: null, accessToken: null, isAuthenticated: false, selectedModel: 'auto' }),
}))
