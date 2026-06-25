import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, RotateCcw, Printer, Timer, TimerOff, AlignLeft, AlignCenter } from 'lucide-react'
import { grammarApi } from '../api/client'
import { useGrammarStore } from '../store/grammarStore'
import type { GrammarQuestion } from '../types'
import GrammarPrintView from '../components/GrammarPrintView'

const GRAMMAR_FONT_SIZE_KEY = 'screenVocaGrammarFontSize'
const GRAMMAR_ALIGN_KEY = 'screenVocaGrammarAlign'
const FONT_SIZE_STEP = 4
const FONT_SIZE_MIN = 16
const FONT_SIZE_MAX = 72

// ── Save dialog ───────────────────────────────────────────────────────────

function SaveDialog({ onSave, onSkip }: { onSave: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800 mb-2">출제 이력을 저장할까요?</h2>
        <p className="text-slate-500 text-sm mb-6">
          저장하면 다음 출제 시 이 문제들은 제외됩니다.
        </p>
        <div className="flex gap-3">
          <button onClick={onSkip} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            저장 안 함
          </button>
          <button onClick={onSave} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors">
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Panel mode: show all questions at once ────────────────────────────────

function PanelMode({
  questions,
  mcq,
  revealed,
  onReveal,
  fontSize,
  align,
}: {
  questions: GrammarQuestion[]
  mcq: boolean
  revealed: Set<number>
  onReveal: (id: number) => void
  fontSize: number
  align: 'left' | 'center'
}) {
  return (
    <div className="flex flex-col gap-4 p-6">
      {questions.map((q, i) => {
        const isRevealed = revealed.has(q.id)
        return (
          <div
            key={q.id}
            onClick={() => onReveal(q.id)}
            className={`rounded-2xl border-2 p-6 cursor-pointer transition-all select-none
              ${isRevealed
                ? 'border-violet-400 bg-violet-50'
                : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md'}`}
          >
            <div className="flex items-start gap-4">
              <span
                className={`font-bold shrink-0 rounded-full flex items-center justify-center
                  ${isRevealed ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                style={{ width: fontSize + 8, height: fontSize + 8, fontSize: fontSize * 0.6 }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-medium leading-relaxed" style={{ fontSize, textAlign: align }}>
                  {q.error_sentence.split(q.error_word).map((part, idx, arr) => (
                    idx < arr.length - 1 ? (
                      <span key={idx}>
                        {part}
                        <span className={`font-bold underline decoration-2 ${isRevealed ? 'text-red-500 line-through decoration-red-400' : 'text-slate-800 decoration-slate-400'}`}>
                          {q.error_word}
                        </span>
                      </span>
                    ) : <span key={idx}>{part}</span>
                  ))}
                </p>

                {mcq && q.mcq_options && !isRevealed && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {q.mcq_options.map((opt, oi) => (
                      <div key={oi} className="border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600" style={{ fontSize: fontSize * 0.75 }}>
                        <span className="font-bold text-slate-400 mr-1">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </div>
                    ))}
                  </div>
                )}

                {isRevealed && (
                  <div className="mt-3 space-y-1">
                    <p className="text-violet-700 font-semibold" style={{ fontSize, textAlign: align }}>
                      → {q.correct_sentence}
                    </p>
                    <p className="text-slate-500" style={{ fontSize: fontSize * 0.7, textAlign: align }}>{q.explanation_ko}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Flashcard mode: one at a time ────────────────────────────────────────

function FlashcardMode({
  questions,
  index,
  mcq,
  revealed,
  onReveal,
  onPrev,
  onNext,
  fontSize,
  align,
}: {
  questions: GrammarQuestion[]
  index: number
  mcq: boolean
  revealed: Set<number>
  onReveal: (id: number) => void
  onPrev: () => void
  onNext: () => void
  fontSize: number
  align: 'left' | 'center'
}) {
  const q = questions[index]
  const isRevealed = revealed.has(q.id)
  const total = questions.length
  const errorParts = q.error_sentence.split(q.error_word)

  return (
    <div
      className="flex-1 overflow-auto flex flex-col items-center justify-center px-8 py-6 cursor-pointer select-none"
      onClick={() => onReveal(q.id)}
    >
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <span className="text-slate-400 text-sm font-mono">{index + 1} / {total}</span>
        </div>

        <div className={`rounded-2xl border-2 p-8 transition-all
          ${isRevealed ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'}`}>

          <p className="font-medium text-slate-800 leading-relaxed" style={{ fontSize, textAlign: align }}>
            {errorParts.map((part, idx, arr) => (
              idx < arr.length - 1 ? (
                <span key={idx}>
                  {part}
                  <span className={`font-bold underline decoration-2 ${isRevealed ? 'text-red-500 line-through decoration-red-400' : 'text-slate-800 decoration-slate-400'}`}>
                    {q.error_word}
                  </span>
                </span>
              ) : <span key={idx}>{part}</span>
            ))}
          </p>

          {mcq && q.mcq_options && !isRevealed && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {q.mcq_options.map((opt, oi) => (
                <div key={oi} className="border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600 text-center" style={{ fontSize: fontSize * 0.75 }}>
                  <span className="font-bold text-slate-400 mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                </div>
              ))}
            </div>
          )}

          {isRevealed && (
            <div className="mt-6 space-y-2">
              <p className="font-bold text-violet-700" style={{ fontSize, textAlign: align }}>→ {q.correct_sentence}</p>
              <p className="text-slate-500" style={{ fontSize: fontSize * 0.7, textAlign: align }}>{q.explanation_ko}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            disabled={index === 0}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            disabled={index === total - 1}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main GrammarQuiz ──────────────────────────────────────────────────────

export default function GrammarQuiz() {
  const navigate = useNavigate()
  const { config } = useGrammarStore()

  const [questions, setQuestions] = useState<GrammarQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [flashIndex, setFlashIndex] = useState(0)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const [timerSec, setTimerSec] = useState<number | null>(config.timerSeconds)
  const [timerCount, setTimerCount] = useState(config.timerSeconds ?? 0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(GRAMMAR_FONT_SIZE_KEY)
    return saved ? parseInt(saved, 10) : 28
  })
  const [align, setAlign] = useState<'left' | 'center'>(() =>
    (localStorage.getItem(GRAMMAR_ALIGN_KEY) as 'left' | 'center') ?? 'left'
  )

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, prev + delta))
      localStorage.setItem(GRAMMAR_FONT_SIZE_KEY, String(next))
      return next
    })
  }

  const toggleAlign = () => {
    setAlign((prev) => {
      const next = prev === 'left' ? 'center' : 'left'
      localStorage.setItem(GRAMMAR_ALIGN_KEY, next)
      return next
    })
  }

  const isFlashcard = config.displayMode === 'flashcard' || config.count === 1

  useEffect(() => {
    if (!config.categoryCodes.length) { navigate('/grammar/setup'); return }
    grammarApi.generate({
      category_codes: config.categoryCodes,
      count: config.count,
      class_id: config.grammarClass?.id,
      mcq: config.mcq,
    }).then((qs) => {
      setQuestions(qs)
      setLoading(false)
    })
  }, [])

  // ── Timer ────────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startTimer = useCallback((sec: number) => {
    clearTimer()
    setTimerCount(sec)
    timerRef.current = setInterval(() => {
      setTimerCount((c) => {
        if (c <= 1) {
          if (isFlashcard) {
            setFlashIndex((i) => {
              if (i < questions.length - 1) { setRevealed(new Set()); return i + 1 }
              clearTimer()
              return i
            })
          }
          return sec
        }
        return c - 1
      })
    }, 1000)
  }, [clearTimer, isFlashcard, questions.length])

  useEffect(() => {
    if (timerSec) startTimer(timerSec)
    else clearTimer()
    return clearTimer
  }, [timerSec, flashIndex])

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isFlashcard) return
      if (e.key === 'ArrowRight') setFlashIndex((i) => Math.min(i + 1, questions.length - 1))
      if (e.key === 'ArrowLeft') setFlashIndex((i) => Math.max(i - 1, 0))
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const q = questions[flashIndex]
        if (q) setRevealed((r) => { const n = new Set(r); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFlashcard, questions, flashIndex])

  const handleReveal = (id: number) => {
    setRevealed((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleExit = () => {
    if (config.saveHistory && config.grammarClass && questions.length > 0) {
      setShowSaveDialog(true)
    } else {
      navigate('/')
    }
  }

  const handleSaveHistory = async () => {
    if (!config.grammarClass) { navigate('/'); return }
    const today = new Date().toISOString().split('T')[0]
    await grammarApi.saveHistory({
      class_id: config.grammarClass.id,
      quiz_date: today,
      question_ids: questions.map((q) => q.id),
      category_codes: config.categoryCodes,
    })
    navigate('/')
  }

  const handleRestart = async () => {
    setLoading(true)
    setRevealed(new Set())
    setFlashIndex(0)
    const qs = await grammarApi.generate({
      category_codes: config.categoryCodes,
      count: config.count,
      class_id: config.grammarClass?.id,
      mcq: config.mcq,
    })
    setQuestions(qs)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-lg">문제 준비 중...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col select-none">
      {/* Header */}
      <div className="text-center pt-5 pb-1 px-4 shrink-0">
        <p className="text-slate-400 text-sm font-medium">
          문법 오답 찾기
          {config.grammarClass && ` — ${config.grammarClass.name}`}
        </p>
      </div>
      <div className="absolute top-4 right-5">
        <span className="text-slate-400 text-sm font-mono">{questions.length}문제</span>
      </div>

      {/* Content — scrollable */}
      {isFlashcard ? (
        <FlashcardMode
          questions={questions}
          index={flashIndex}
          mcq={config.mcq}
          revealed={revealed}
          onReveal={handleReveal}
          onPrev={() => setFlashIndex((i) => Math.max(0, i - 1))}
          onNext={() => setFlashIndex((i) => Math.min(questions.length - 1, i + 1))}
          fontSize={fontSize}
          align={align}
        />
      ) : (
        <div className="flex-1 overflow-auto">
          <PanelMode
            questions={questions}
            mcq={config.mcq}
            revealed={revealed}
            onReveal={handleReveal}
            fontSize={fontSize}
            align={align}
          />
        </div>
      )}

      {/* Timer bar */}
      {timerSec && (
        <div className="w-full bg-slate-800 h-1 shrink-0">
          <div
            className="bg-violet-500 h-1 transition-all duration-1000"
            style={{ width: `${(timerCount / timerSec) * 100}%` }}
          />
        </div>
      )}

      {/* Bottom bar — fixed at bottom */}
      <div className="shrink-0 bg-slate-800/80 backdrop-blur border-t border-slate-700 px-6 py-4 flex items-center gap-3">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm shrink-0"
        >
          <X size={16} /> Exit
        </button>

        <span className="text-slate-600 text-xs hidden sm:block">
          {isFlashcard ? 'Space: 공개 · ← →: 이동' : '패널 터치: 정답 공개'}
        </span>

        {!isFlashcard && (
          <button
            onClick={() => {
              if (revealed.size === questions.length) {
                setRevealed(new Set())
              } else {
                setRevealed(new Set(questions.map((q) => q.id)))
              }
            }}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {revealed.size === questions.length ? '전체 숨기기' : '전체 공개'}
          </button>
        )}

        <div className="flex-1" />

        {/* Align toggle */}
        <button
          onClick={toggleAlign}
          title={align === 'left' ? '가운데 정렬로 변경' : '왼쪽 정렬로 변경'}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          {align === 'left' ? <AlignLeft size={18} /> : <AlignCenter size={18} />}
        </button>

        {/* Font size */}
        <button
          onClick={() => adjustFontSize(-FONT_SIZE_STEP)}
          disabled={fontSize <= FONT_SIZE_MIN}
          title="글자 크기 줄이기"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-600 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600 hover:border-slate-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => adjustFontSize(FONT_SIZE_STEP)}
          disabled={fontSize >= FONT_SIZE_MAX}
          title="글자 크기 키우기"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-600 bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600 hover:border-slate-500 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          title="새 문제 뽑기"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw size={18} />
        </button>

        {/* Timer */}
        <div className="relative">
          <button
            onClick={() => setShowTimerMenu((v) => !v)}
            title="자동 넘김 타이머"
            className={`p-2.5 rounded-lg transition-colors ${timerSec ? 'text-green-400 bg-green-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {timerSec ? <Timer size={18} /> : <TimerOff size={18} />}
          </button>
          {showTimerMenu && (
            <div className="absolute bottom-12 right-0 bg-slate-800 border border-slate-600 rounded-xl p-2 shadow-xl z-20 w-36">
              {[null, 5, 10, 15, 20, 30].map((sec) => (
                <button
                  key={sec ?? 'off'}
                  onClick={() => { setTimerSec(sec); setShowTimerMenu(false) }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${timerSec === sec ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {sec ? `${sec}초` : 'OFF'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Print */}
        <button
          onClick={() => setShowPrint(true)}
          title="시험지 인쇄"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Printer size={18} />
        </button>
      </div>

      {showSaveDialog && (
        <SaveDialog onSave={handleSaveHistory} onSkip={() => navigate('/')} />
      )}
      {showPrint && (
        <GrammarPrintView
          questions={questions}
          mcq={config.mcq}
          className={config.grammarClass?.name}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  )
}
