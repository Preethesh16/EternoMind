import { create } from 'zustand'

export interface Interaction {
  interaction_number: number
  token_count_input: number
  token_count_output: number
  model_used: string
  memory_hits: number
  latency_ms: number
}

interface MetricsState {
  interactions: Interaction[]
  setInteractions: (data: Interaction[]) => void
  addInteraction: (i: Interaction) => void
  clearInteractions: () => void
}

export const useMetricsStore = create<MetricsState>((set) => ({
  interactions: [],

  setInteractions: (data) => set({ interactions: data }),

  addInteraction: (i) =>
    set((state) => ({ interactions: [...state.interactions, i] })),

  clearInteractions: () => set({ interactions: [] }),
}))
