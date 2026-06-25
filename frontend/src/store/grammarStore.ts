import { create } from 'zustand'
import type { GrammarQuizConfig } from '../types'

const DEFAULT: GrammarQuizConfig = {
  teacher: null,
  grammarClass: null,
  categoryCodes: [],
  count: 5,
  mcq: false,
  displayMode: 'panel',
  timerSeconds: null,
  saveHistory: false,
}

interface GrammarStore {
  config: GrammarQuizConfig
  setConfig: (c: GrammarQuizConfig) => void
  reset: () => void
}

export const useGrammarStore = create<GrammarStore>((set) => ({
  config: { ...DEFAULT },
  setConfig: (c) => set({ config: c }),
  reset: () => set({ config: { ...DEFAULT } }),
}))
