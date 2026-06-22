export interface Word {
  section: string
  seq: number
  english: string
  korean: string
}

export interface FontSettings {
  family: string
  size: number
  color: string
}

export type DisplayMode = 'meaning' | 'spelling' | 'alternating'

export type PeriodLabel =
  | 'This Week'
  | '1 Week Ago'
  | '2 Weeks Ago'
  | '3 Weeks Ago'
  | '1 Month Ago'
  | string  // custom

export interface SessionConfig {
  periodLabel: PeriodLabel
  bookName: string
  sections: string[]
  words: Word[]
  displayMode: DisplayMode
  fontSettings: FontSettings
  shuffle: boolean
  timerSeconds: number | null
}

export interface SavedSession {
  id: number
  name: string
  book_name: string
  period_label: string
  sections: string[]
  words: Word[]
  display_mode: DisplayMode
  font_settings: FontSettings
  shuffle: boolean
  timer_seconds: number | null
  created_at: string
}

export interface ParsedVocab {
  book_name: string
  sections: string[]
  words: Word[]
}
