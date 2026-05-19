import { create } from 'zustand'

export interface MessageMetrics {
  total_tokens: number
  model: string
  latency_ms: number
  memory_hits: number
  optimized_prompt?: string
  prompt_goal?: string
  complexity_score?: number
  token_estimate?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming: boolean
  metrics?: MessageMetrics
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  currentPipelineStep: string | null
  addUserMessage: (content: string) => string
  startAssistantMessage: () => string
  appendToken: (id: string, token: string) => void
  finalizeMessage: (id: string, metrics: MessageMetrics) => void
  setPipelineStep: (step: string | null) => void
  clearMessages: () => void
}

let _idCounter = 0
const genId = () => `msg_${++_idCounter}`

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  currentPipelineStep: null,

  addUserMessage: (content) => {
    const id = genId()
    set((state) => ({
      messages: [...state.messages, { id, role: 'user', content, isStreaming: false }],
      isLoading: true,
    }))
    return id
  },

  startAssistantMessage: () => {
    const id = genId()
    set((state) => ({
      messages: [...state.messages, { id, role: 'assistant', content: '', isStreaming: true }],
    }))
    return id
  },

  appendToken: (id, token) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + token } : m
      ),
    }))
  },

  finalizeMessage: (id, metrics) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false, metrics } : m
      ),
      isLoading: false,
      currentPipelineStep: null,
    }))
  },

  setPipelineStep: (step) => set({ currentPipelineStep: step }),

  clearMessages: () => set({ messages: [], isLoading: false, currentPipelineStep: null }),
}))
