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

// ── Grammar types ────────────────────────────────────────────────────────────

export interface GrammarCategory {
  id: number
  code: string
  name_ko: string
  parent_id: number | null
  depth: number
  sort_order: number
}

export interface GrammarQuestion {
  id: number
  category_code: string
  error_sentence: string
  correct_sentence: string
  error_word: string
  correct_word: string
  explanation_ko: string
  mcq_options: string[] | null
  difficulty: string
  is_custom: boolean
}

export interface GrammarTeacher {
  id: number
  name: string
}

export interface GrammarClass {
  id: number
  teacher_id: number
  name: string
}

export interface QuizHistoryRecord {
  id: number
  class_id: number
  quiz_date: string
  question_ids: number[]
  category_codes: string[]
  created_at: string
}

export interface GrammarQuizConfig {
  teacher: GrammarTeacher | null
  grammarClass: GrammarClass | null
  categoryCodes: string[]
  count: number
  mcq: boolean
  displayMode: 'panel' | 'flashcard'
  timerSeconds: number | null
  saveHistory: boolean
}
