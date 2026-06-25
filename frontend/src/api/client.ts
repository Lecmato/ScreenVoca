import axios from 'axios'
import type {
  ParsedVocab, SavedSession, SessionConfig, Word,
  GrammarCategory, GrammarQuestion, GrammarTeacher, GrammarClass, QuizHistoryRecord,
} from '../types'

const api = axios.create({ baseURL: '/api' })

export const vocabApi = {
  parseFile: async (file: File): Promise<ParsedVocab> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<ParsedVocab>('/vocab/parse', form)
    return data
  },

  getWords: async (sections: string[]): Promise<Word[]> => {
    const { data } = await api.get<Word[]>('/vocab/words', {
      params: { sections: sections.join(',') },
    })
    return data
  },
}

export const sessionsApi = {
  list: async (): Promise<SavedSession[]> => {
    const { data } = await api.get<SavedSession[]>('/sessions/')
    return data
  },

  get: async (id: number): Promise<SavedSession> => {
    const { data } = await api.get<SavedSession>(`/sessions/${id}`)
    return data
  },

  save: async (config: SessionConfig): Promise<SavedSession> => {
    const payload = {
      book_name: config.bookName,
      period_label: config.periodLabel,
      sections: config.sections,
      words: config.words,
      display_mode: config.displayMode,
      font_settings: config.fontSettings,
      shuffle: config.shuffle,
      timer_seconds: config.timerSeconds,
    }
    const { data } = await api.post<SavedSession>('/sessions/', payload)
    return data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}`)
  },
}

export const grammarApi = {
  categories: async (): Promise<GrammarCategory[]> => {
    const { data } = await api.get<GrammarCategory[]>('/grammar/categories')
    return data
  },

  generate: async (payload: {
    category_codes: string[]
    count: number
    class_id?: number
    mcq: boolean
  }): Promise<GrammarQuestion[]> => {
    const { data } = await api.post<GrammarQuestion[]>('/grammar/generate', payload)
    return data
  },

  saveHistory: async (payload: {
    class_id: number
    quiz_date: string
    question_ids: number[]
    category_codes: string[]
    options_snapshot?: object
  }): Promise<{ id: number }> => {
    const { data } = await api.post('/grammar/history', payload)
    return data
  },

  getHistory: async (classId: number): Promise<QuizHistoryRecord[]> => {
    const { data } = await api.get<QuizHistoryRecord[]>(`/grammar/history/${classId}`)
    return data
  },

  deleteHistory: async (recordId: number): Promise<void> => {
    await api.delete(`/grammar/history/${recordId}`)
  },

  teachers: async (): Promise<GrammarTeacher[]> => {
    const { data } = await api.get<GrammarTeacher[]>('/grammar/teachers')
    return data
  },

  createTeacher: async (name: string): Promise<GrammarTeacher> => {
    const { data } = await api.post<GrammarTeacher>('/grammar/teachers', { name })
    return data
  },

  classes: async (teacherId?: number): Promise<GrammarClass[]> => {
    const { data } = await api.get<GrammarClass[]>('/grammar/classes', {
      params: teacherId ? { teacher_id: teacherId } : {},
    })
    return data
  },

  createClass: async (teacherId: number, name: string): Promise<GrammarClass> => {
    const { data } = await api.post<GrammarClass>('/grammar/classes', {
      teacher_id: teacherId, name,
    })
    return data
  },

  questions: async (categoryCode?: string): Promise<GrammarQuestion[]> => {
    const { data } = await api.get<GrammarQuestion[]>('/grammar/questions', {
      params: categoryCode ? { category_code: categoryCode } : {},
    })
    return data
  },

  createQuestion: async (payload: {
    category_code: string
    error_sentence: string
    correct_sentence: string
    error_word: string
    correct_word: string
    explanation_ko: string
    difficulty: string
  }): Promise<{ id: number }> => {
    const { data } = await api.post('/grammar/questions', payload)
    return data
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await api.delete(`/grammar/questions/${id}`)
  },
}
