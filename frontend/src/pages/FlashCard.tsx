import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, X, Volume2, Shuffle, Timer,
  TimerOff, RotateCcw, Printer,
} from 'lucide-react'
import { sessionsApi } from '../api/client'
import { useSessionStore } from '../store/sessionStore'
import type { Word, DisplayMode } from '../types'
import PrintView from '../components/PrintView'

const FONT_SIZE_KEY = 'screenVocaFontSize'
const FONT_SIZE_STEP = 10
const FONT_SIZE_MIN = 40
const FONT_SIZE_MAX = 300

type CardSide = 'front' | 'back'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getFront(word: Word, mode: DisplayMode, cardIndex: number): string {
  if (mode === 'meaning') return word.english
  if (mode === 'spelling') return word.korean
  return cardIndex % 2 === 0 ? word.english : word.korean
}

function getBack(word: Word, mode: DisplayMode, cardIndex: number): string {
  if (mode === 'meaning') return word.korean
  if (mode === 'spelling') return word.english
  return cardIndex % 2 === 0 ? word.korean : word.english
}

function speak(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

// ── Save-on-exit dialog ─────────────────────────────────────────────────────

function SaveDialog({ onSave, onDiscard }: { onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800 mb-2">세션을 저장할까요?</h2>
        <p className="text-slate-500 text-sm mb-6">
          저장하면 나중에 동일한 단어 설정으로 바로 시작할 수 있습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            저장 안 함
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main FlashCard ──────────────────────────────────────────────────────────

export default function FlashCard() {
  const navigate = useNavigate()
  const { config } = useSessionStore()

  useEffect(() => {
    if (!config.words.length) navigate('/', { replace: true })
    document.body.classList.add('flashcard-mode')
    return () => document.body.classList.remove('flashcard-mode')
  }, [])

  // Font size — persisted in localStorage per machine
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY)
    return saved ? parseInt(saved, 10) : config.fontSettings.size
  })

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, prev + delta))
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }

  const [words, setWords] = useState<Word[]>(() =>
    config.shuffle ? shuffle(config.words) : [...config.words]
  )
  const [index, setIndex] = useState(0)
  const [side, setSide] = useState<CardSide>('front')
  const [shuffleOn, setShuffleOn] = useState(config.shuffle)
  const [timerSec, setTimerSec] = useState<number | null>(config.timerSeconds)
  const [timerCount, setTimerCount] = useState<number>(timerSec ?? 0)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [showTimerMenu, setShowTimerMenu] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = words.length
  const word = words[index]
  const mode = config.displayMode
  const font = config.fontSettings

  const front = word ? getFront(word, mode, index) : ''
  const back = word ? getBack(word, mode, index) : ''

  // ── Timer ────────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startTimer = useCallback(
    (sec: number) => {
      clearTimer()
      setTimerCount(sec)
      timerRef.current = setInterval(() => {
        setTimerCount((c) => {
          if (c <= 1) {
            setIndex((i) => {
              const next = i + 1
              if (next >= total) { clearTimer(); return i }
              setSide('front')
              return next
            })
            return sec
          }
          return c - 1
        })
      }, 1000)
    },
    [clearTimer, total]
  )

  useEffect(() => {
    if (timerSec) startTimer(timerSec)
    else clearTimer()
    return clearTimer
  }, [timerSec, index])

  // ── Navigation ───────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (index < total - 1) { setIndex((i) => i + 1); setSide('front') }
  }, [index, total])

  const goPrev = useCallback(() => {
    if (index > 0) { setIndex((i) => i - 1); setSide('front') }
  }, [index])

  const flip = useCallback(() => setSide((s) => (s === 'front' ? 'back' : 'front')), [])

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [flip, goNext, goPrev])

  // ── Shuffle ───────────────────────────────────────────────────────────────

  const toggleShuffle = () => {
    const next = !shuffleOn
    setShuffleOn(next)
    setWords(next ? shuffle(config.words) : [...config.words])
    setIndex(0)
    setSide('front')
  }

  // ── Exit ─────────────────────────────────────────────────────────────────

  const handleExit = () => setShowSaveDialog(true)

  const handleSave = async () => {
    try { await sessionsApi.save(config) } catch { /* silent */ }
    setShowSaveDialog(false)
    navigate('/')
  }

  const handleDiscard = () => { setShowSaveDialog(false); navigate('/') }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  if (!word) return null

  const sectionRange =
    config.sections.length === 1
      ? `[${config.sections[0]}]`
      : `[${config.sections[0]} ~ ${config.sections[config.sections.length - 1]}]`

  const periodDisplay = `${config.periodLabel} Voca ${sectionRange}`

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col select-none">
      {/* Top: period label */}
      <div className="text-center pt-6 pb-2 px-4">
        <p className="text-slate-400 text-base font-medium tracking-wide">{periodDisplay}</p>
      </div>

      {/* Counter top-right */}
      <div className="absolute top-4 right-5">
        <span className="text-slate-400 text-sm font-mono">{index + 1} / {total}</span>
      </div>

      {/* Main card area — click to flip */}
      <div
        className="flex-1 flex items-center justify-center cursor-pointer px-8"
        onClick={flip}
      >
        <div className="text-center">
          {side === 'front' ? (
            <span
              style={{
                fontFamily: font.family,
                fontSize: `${fontSize}px`,
                color: font.color,
                lineHeight: 1.1,
              }}
              className="font-bold block"
            >
              {front}
            </span>
          ) : (
            <span
              style={{
                fontFamily: font.family,
                fontSize: `${Math.max(fontSize * 0.7, 40)}px`,
                color: '#94a3b8',
                lineHeight: 1.2,
              }}
              className="font-semibold block"
            >
              {back}
            </span>
          )}
        </div>
      </div>

      {/* Timer progress bar */}
      {timerSec && (
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-indigo-500 h-1 transition-all duration-1000"
            style={{ width: `${(timerCount / timerSec) * 100}%` }}
          />
        </div>
      )}

      {/* Bottom control bar */}
      <div className="bg-slate-800/80 backdrop-blur border-t border-slate-700 px-6 py-4 flex items-center gap-3">

        {/* Left: Exit + hint */}
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm shrink-0"
        >
          <X size={16} /> Exit
        </button>
        <span className="text-slate-600 text-xs hidden sm:block">
          Space: 정답 공개 &nbsp;·&nbsp; ← →: 이동
        </span>

        <div className="flex-1" />

        {/* Center: Prev / Next */}
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={goNext}
          disabled={index === total - 1}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Next <ChevronRight size={18} />
        </button>

        <div className="flex-1" />

        {/* Right: utilities */}

        {/* Font size < > — left of TTS */}
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

        {/* TTS */}
        <button
          onClick={() => speak(word.english)}
          title="영어 발음 듣기"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Volume2 size={18} />
        </button>

        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          title="랜덤 순서"
          className={`p-2.5 rounded-lg transition-colors ${shuffleOn ? 'text-indigo-400 bg-indigo-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          <Shuffle size={18} />
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
              {[null, 3, 5, 7, 10].map((sec) => (
                <button
                  key={sec ?? 'off'}
                  onClick={() => { setTimerSec(sec); setShowTimerMenu(false) }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                    ${timerSec === sec ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {sec ? `${sec}초` : 'OFF'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setSide('front'); setIndex(0) }}
          title="처음으로"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw size={18} />
        </button>

        {/* Print */}
        <button
          onClick={() => setShowPrint(true)}
          title="시험지 인쇄"
          className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Printer size={18} />
        </button>
      </div>

      {/* Dialogs */}
      {showSaveDialog && <SaveDialog onSave={handleSave} onDiscard={handleDiscard} />}
      {showPrint && (
        <PrintView
          words={words}
          bookName={config.bookName}
          sections={config.sections}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  )
}
