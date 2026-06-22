import axios from 'axios'
import type { ParsedVocab, SavedSession, SessionConfig, Word } from '../types'

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
