import { create } from 'zustand'
import type { SessionConfig, DisplayMode, FontSettings, Word, PeriodLabel } from '../types'

const DEFAULT_FONT: FontSettings = {
  family: 'Arial',
  size: 120,
  color: '#ffffff',
}

const DEFAULT_CONFIG: SessionConfig = {
  periodLabel: 'This Week',
  bookName: '',
  sections: [],
  words: [],
  displayMode: 'meaning',
  fontSettings: DEFAULT_FONT,
  shuffle: false,
  timerSeconds: null,
}

interface SessionStore {
  config: SessionConfig
  step: number

  setPeriodLabel: (label: PeriodLabel) => void
  setBookAndSections: (bookName: string, sections: string[]) => void
  setWords: (words: Word[]) => void
  setDisplayMode: (mode: DisplayMode) => void
  setFontSettings: (settings: FontSettings) => void
  setShuffle: (v: boolean) => void
  setTimerSeconds: (v: number | null) => void
  setStep: (step: number) => void
  loadFromSaved: (saved: {
    period_label: string
    book_name: string
    sections: string[]
    words: Word[]
    display_mode: DisplayMode
    font_settings: FontSettings
    shuffle: boolean
    timer_seconds: number | null
  }) => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  config: { ...DEFAULT_CONFIG },
  step: 1,

  setPeriodLabel: (label) =>
    set((s) => ({ config: { ...s.config, periodLabel: label } })),

  setBookAndSections: (bookName, sections) =>
    set((s) => ({ config: { ...s.config, bookName, sections } })),

  setWords: (words) =>
    set((s) => ({ config: { ...s.config, words } })),

  setDisplayMode: (mode) =>
    set((s) => ({ config: { ...s.config, displayMode: mode } })),

  setFontSettings: (settings) =>
    set((s) => ({ config: { ...s.config, fontSettings: settings } })),

  setShuffle: (v) =>
    set((s) => ({ config: { ...s.config, shuffle: v } })),

  setTimerSeconds: (v) =>
    set((s) => ({ config: { ...s.config, timerSeconds: v } })),

  setStep: (step) => set({ step }),

  loadFromSaved: (saved) =>
    set({
      config: {
        periodLabel: saved.period_label as PeriodLabel,
        bookName: saved.book_name,
        sections: saved.sections,
        words: saved.words,
        displayMode: saved.display_mode,
        fontSettings: saved.font_settings,
        shuffle: saved.shuffle,
        timerSeconds: saved.timer_seconds,
      },
      step: 1,
    }),

  reset: () => set({ config: { ...DEFAULT_CONFIG }, step: 1 }),
}))
