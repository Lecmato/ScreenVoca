import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Upload, Check, ChevronLeft } from 'lucide-react'
import { vocabApi } from '../api/client'
import { useSessionStore } from '../store/sessionStore'
import type { Word, DisplayMode, FontSettings, ParsedVocab } from '../types'

const PERIOD_OPTIONS = [
  'This Week',
  '1 Week Ago',
  '2 Weeks Ago',
  '3 Weeks Ago',
  '1 Month Ago',
]

const FONT_FAMILIES = [
  'Arial',
  'Impact',
  'Times New Roman',
  'Comic Sans MS',
  'Malgun Gothic',
  'Courier New',
]

const STEP_LABELS = ['시기 선택', '단원 선택', '단어 선택', '표시 설정']

// ── Step 1: Period ──────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const { config, setPeriodLabel } = useSessionStore()
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const selectPeriod = (label: string) => {
    setUseCustom(false)
    setPeriodLabel(label)
  }

  const confirmCustom = () => {
    if (custom.trim()) {
      setPeriodLabel(custom.trim())
      setUseCustom(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-500 text-sm">이 단어들을 언제 배운 단어로 표시할까요?</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => selectPeriod(opt)}
            className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm
              ${config.periodLabel === opt && !useCustom
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={() => setUseCustom(true)}
          className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all text-sm
            ${useCustom
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
        >
          직접 입력
        </button>
      </div>
      {useCustom && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirmCustom()}
            placeholder="예: Last Semester, Chapter 3..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={confirmCustom}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            확인
          </button>
        </div>
      )}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onNext}
          disabled={!config.periodLabel}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          다음 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: File + Sections ─────────────────────────────────────────────────

function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { config, setBookAndSections } = useSessionStore()
  const [parsed, setParsed] = useState<ParsedVocab | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set(config.sections))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError('')
    try {
      const data = await vocabApi.parseFile(file)
      setParsed(data)
      setSelected(new Set())
    } catch {
      setError('파일 파싱에 실패했습니다. xlsx 파일인지 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (s: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  const handleNext = () => {
    if (!parsed || selected.size === 0) return
    const orderedSections = parsed.sections.filter((s) => selected.has(s))
    setBookAndSections(parsed.book_name, orderedSections)
    onNext()
  }

  return (
    <div className="space-y-5">
      {/* File upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
      >
        <Upload className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="font-semibold text-slate-600">
          {parsed ? parsed.book_name : '엑셀 파일을 클릭하거나 드래그하세요'}
        </p>
        <p className="text-xs text-slate-400 mt-1">.xlsx 형식만 지원</p>
        {loading && <p className="text-indigo-500 text-sm mt-2">파싱 중...</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Section selection */}
      {parsed && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">단원 선택 (다중 선택 가능)</p>
            <button
              onClick={() => {
                if (selected.size === parsed.sections.length) {
                  setSelected(new Set())
                } else {
                  setSelected(new Set(parsed.sections))
                }
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              {selected.size === parsed.sections.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {parsed.sections.map((s) => (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all text-left
                  ${selected.has(s)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                  ${selected.has(s) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                  {selected.has(s) && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{selected.size}개 단원 선택됨</p>
        </div>
      )}

      <div className="pt-2 flex justify-between">
        <button onClick={onPrev} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={16} /> 이전
        </button>
        <button
          onClick={handleNext}
          disabled={!parsed || selected.size === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          다음 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Word Selection ──────────────────────────────────────────────────

function Step3({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { config, setWords } = useSessionStore()
  const [allWords, setAllWords] = useState<Word[]>([])
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [loaded, setLoaded] = useState(false)

  // Load words for selected sections on mount
  if (!loaded && config.sections.length > 0) {
    setLoaded(true)
    vocabApi.getWords(config.sections).then((words) => {
      setAllWords(words)
      setChecked(new Set()) // all unchecked by default
    })
  }

  const toggle = (idx: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })

  const toggleAll = () => {
    if (checked.size === allWords.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(allWords.map((_, i) => i)))
    }
  }

  const handleNext = () => {
    const selected = allWords.filter((_, i) => checked.has(i))
    if (selected.length === 0) return
    setWords(selected)
    onNext()
  }

  // Group by section for display
  const bySection: Record<string, { word: Word; idx: number }[]> = {}
  allWords.forEach((w, i) => {
    if (!bySection[w.section]) bySection[w.section] = []
    bySection[w.section].push({ word: w, idx: i })
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">포함할 단어를 선택하세요</p>
        <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
          {checked.size === allWords.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-4 border border-slate-200 rounded-xl p-4">
        {Object.entries(bySection).map(([section, items]) => (
          <div key={section}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{section}</p>
            <div className="space-y-1">
              {items.map(({ word, idx }) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <div
                    onClick={() => toggle(idx)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                      ${checked.has(idx) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}
                  >
                    {checked.has(idx) && <Check size={11} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-500 w-6 shrink-0">{String(word.seq).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-slate-800 flex-1">{word.english}</span>
                  <span className="text-sm text-slate-400">{word.korean}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">{checked.size}개 단어 선택됨</p>

      <div className="flex justify-between pt-2">
        <button onClick={onPrev} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={16} /> 이전
        </button>
        <button
          onClick={handleNext}
          disabled={checked.size === 0}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          다음 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Display Settings ────────────────────────────────────────────────

function Step4({ onStart, onPrev }: { onStart: () => void; onPrev: () => void }) {
  const { config, setDisplayMode, setFontSettings } = useSessionStore()
  const font = config.fontSettings

  const updateFont = (patch: Partial<FontSettings>) =>
    setFontSettings({ ...font, ...patch })

  const MODE_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
    { value: 'meaning', label: 'Meaning', desc: '영어 → 한글 뜻 맞추기' },
    { value: 'spelling', label: 'Spelling', desc: '한글 → 영어 철자 맞추기' },
    { value: 'alternating', label: 'Alternating', desc: '두 가지 번갈아 표시' },
  ]

  const previewWord = config.words[0]?.english ?? 'hello'

  return (
    <div className="space-y-6">
      {/* Mode */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">표시 모드</p>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDisplayMode(opt.value)}
              className={`py-3 px-4 rounded-xl border-2 text-left transition-all
                ${config.displayMode === opt.value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className={`font-bold text-sm ${config.displayMode === opt.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">폰트</label>
          <select
            value={font.family}
            onChange={(e) => updateFont({ family: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">색상</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={font.color}
              onChange={(e) => updateFont({ color: e.target.value })}
              className="w-10 h-10 rounded border border-slate-300 cursor-pointer p-0.5"
            />
            <span className="text-sm text-slate-500 font-mono">{font.color}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
          크기 <span className="font-normal text-slate-400">{font.size}px</span>
        </label>
        <input
          type="range"
          min={40}
          max={220}
          step={4}
          value={font.size}
          onChange={(e) => updateFont({ size: Number(e.target.value) })}
          className="w-full accent-indigo-600"
        />
      </div>

      {/* Live preview */}
      <div className="bg-slate-800 rounded-xl flex items-center justify-center min-h-28">
        <span
          style={{
            fontFamily: font.family,
            fontSize: `${Math.min(font.size, 80)}px`,
            color: font.color,
          }}
          className="font-bold"
        >
          {previewWord}
        </span>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={onPrev} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft size={16} /> 이전
        </button>
        <button
          onClick={onStart}
          className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors text-base"
        >
          시작하기 →
        </button>
      </div>
    </div>
  )
}

// ── Setup root ──────────────────────────────────────────────────────────────

export default function Setup() {
  const navigate = useNavigate()
  const { step, setStep } = useSessionStore()

  const goNext = () => setStep(step + 1)
  const goPrev = () => (step > 1 ? setStep(step - 1) : navigate('/'))
  const goStart = () => navigate('/flashcard')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-700 transition-colors">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-bold text-slate-800">새 세션 설정</h1>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-100 px-6 py-3">
        <div className="flex items-center gap-0 max-w-lg">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const active = n === step
            const done = n < step
            return (
              <div key={n} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                    {done ? <Check size={12} /> : n}
                  </div>
                  <span className={`text-xs mt-1 ${active ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {step === 1 && <Step1 onNext={goNext} />}
          {step === 2 && <Step2 onNext={goNext} onPrev={goPrev} />}
          {step === 3 && <Step3 onNext={goNext} onPrev={goPrev} />}
          {step === 4 && <Step4 onStart={goStart} onPrev={goPrev} />}
        </div>
      </main>
    </div>
  )
}
