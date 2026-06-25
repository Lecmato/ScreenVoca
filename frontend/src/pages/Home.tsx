import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, Play, Trash2, Calendar, Clock, PenLine } from 'lucide-react'
import { sessionsApi } from '../api/client'
import { useSessionStore } from '../store/sessionStore'
import type { SavedSession } from '../types'

const PERIOD_COLORS: Record<string, string> = {
  'This Week': 'bg-green-100 text-green-800',
  '1 Week Ago': 'bg-blue-100 text-blue-800',
  '2 Weeks Ago': 'bg-purple-100 text-purple-800',
  '3 Weeks Ago': 'bg-orange-100 text-orange-800',
  '1 Month Ago': 'bg-red-100 text-red-800',
}

function periodColor(label: string) {
  return PERIOD_COLORS[label] ?? 'bg-gray-100 text-gray-800'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Home() {
  const navigate = useNavigate()
  const { loadFromSaved, reset } = useSessionStore()
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.list,
  })

  const deleteMut = useMutation({
    mutationFn: sessionsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const handleNew = () => {
    reset()
    navigate('/setup')
  }

  const handleLoad = (s: SavedSession) => {
    loadFromSaved(s)
    navigate('/flashcard')
  }

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm('이 세션을 삭제하시겠습니까?')) {
      deleteMut.mutate(id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-600" size={28} />
          <h1 className="text-2xl font-bold text-slate-800">Screen Voca</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/grammar/setup')}
            className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
          >
            <PenLine size={18} />
            문법 오답 찾기
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            새 세션 시작
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center text-slate-400 py-20">불러오는 중...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={56} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 text-lg">저장된 세션이 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">새 세션을 시작하여 단어를 학습하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">
              저장된 세션 {sessions.length}개 — 클릭하면 바로 시작합니다
            </p>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleLoad(s)}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${periodColor(s.period_label)}`}>
                        {s.period_label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {s.display_mode === 'meaning' ? 'Meaning' : s.display_mode === 'spelling' ? 'Spelling' : 'Alternating'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 truncate">{s.name}</h3>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(s.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {s.words.length}개 단어
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Play size={14} />
                      시작
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
