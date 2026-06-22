import { useState, useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import type { Word } from '../types'

type PrintMode = 'meaning' | 'spelling' | 'mixed'

interface PrintViewProps {
  words: Word[]
  bookName: string
  sections: string[]
  onClose: () => void
}

const MODE_OPTIONS: { value: PrintMode; label: string; desc: string }[] = [
  { value: 'meaning',  label: 'Meaning',  desc: '영어 표시 → 뜻 쓰기' },
  { value: 'spelling', label: 'Spelling', desc: '뜻 표시 → 영어 철자 쓰기' },
  { value: 'mixed',    label: 'Mixed',    desc: '좌: 뜻 쓰기 / 우: 철자 쓰기' },
]

export default function PrintView({ words, bookName, sections, onClose }: PrintViewProps) {
  const [mode, setMode] = useState<PrintMode>('meaning')

  const sectionRange =
    sections.length === 1 ? sections[0] : `${sections[0]} ~ ${sections[sections.length - 1]}`

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Screen overlay */}
      <div className="fixed inset-0 bg-black/80 z-50 flex flex-col no-print">
        <div className="bg-white flex items-center justify-between px-6 py-3 shadow gap-6">
          <h2 className="font-bold text-slate-800 shrink-0">시험지 미리보기</h2>

          {/* Mode selector */}
          <div className="flex gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
                  ${mode === opt.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                {opt.label}
                <span className="hidden sm:inline text-xs font-normal ml-1.5 opacity-70">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Printer size={16} /> 인쇄
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-200 p-8 flex justify-center">
          <PrintSheet
            words={words} bookName={bookName}
            sectionRange={sectionRange} today={today} mode={mode}
          />
        </div>
      </div>

      {/* Print-only sheet */}
      <div className="print-only">
        <PrintSheet
          words={words} bookName={bookName}
          sectionRange={sectionRange} today={today} mode={mode}
        />
      </div>
    </>
  )
}

// ── PrintSheet ──────────────────────────────────────────────────────────────

function PrintSheet({
  words, bookName, sectionRange, today, mode,
}: {
  words: Word[]
  bookName: string
  sectionRange: string
  today: string
  mode: PrintMode
}) {
  const left  = words.filter((_, i) => i % 2 === 0)
  const right = words.filter((_, i) => i % 2 === 1)
  const maxRows = Math.max(left.length, right.length)

  const modeLabel =
    mode === 'meaning'  ? '뜻 쓰기 시험 (영어 → 한글)' :
    mode === 'spelling' ? '영어 철자 쓰기 시험 (한글 → 영어)' :
                          '혼합 시험 (좌: 뜻 쓰기 / 우: 철자 쓰기)'

  return (
    <div
      style={{
        width: '210mm', minHeight: '297mm', background: 'white',
        padding: '18mm 16mm', boxSizing: 'border-box',
        fontFamily: "'Malgun Gothic', 'Arial', sans-serif",
        fontSize: '11pt', color: '#111',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '2px' }}>
              {today}
            </p>
            <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
              {bookName}
            </h1>
            <p style={{ fontSize: '10pt', color: '#374151', marginTop: '2px' }}>
              {sectionRange} · {words.length}개 · {modeLabel}
            </p>
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: '10pt', color: '#374151' }}>
            <tbody>
              {['이름', '학년/반', '점수'].map((label) => (
                <tr key={label}>
                  <td style={{ padding: '2px 6px', fontWeight: 'bold', width: '60px' }}>{label}</td>
                  <td style={{ borderBottom: '1px solid #9ca3af', width: '100px', padding: '2px 0' }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table */}
      {mode === 'mixed' ? (
        <MixedTable left={left} right={right} maxRows={maxRows} />
      ) : (
        <UniformTable left={left} right={right} maxRows={maxRows} mode={mode} />
      )}

      {/* Footer */}
      <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', textAlign: 'center', fontSize: '8pt', color: '#9ca3af' }}>
        Screen Voca · {bookName} · {sectionRange}
      </div>
    </div>
  )
}

// ── Uniform table (Meaning or Spelling) ─────────────────────────────────────

function UniformTable({ left, right, maxRows, mode }: {
  left: Word[]; right: Word[]; maxRows: number; mode: 'meaning' | 'spelling'
}) {
  const showCol  = mode === 'meaning' ? '영어' : '뜻'
  const writeCol = mode === 'meaning' ? '뜻' : '영어 철자'

  const cellStyle: React.CSSProperties = {
    padding: '6px 6px', border: '1px solid #e2e8f0', fontSize: '10pt',
  }
  const numStyle: React.CSSProperties = {
    ...cellStyle, textAlign: 'center', color: '#6b7280', fontSize: '9pt',
  }
  const dividerStyle: React.CSSProperties = { ...cellStyle }

  const getDisplay = (w: Word) => mode === 'meaning' ? w.english : w.korean

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '6%' }} /><col style={{ width: '22%' }} /><col style={{ width: '22%' }} />
        <col style={{ width: '6%' }} /><col style={{ width: '22%' }} /><col style={{ width: '22%' }} />
      </colgroup>
      <thead>
        <tr style={{ background: '#f1f5f9' }}>
          {['No', showCol, writeCol, 'No', showCol, writeCol].map((h, i) => (
            <th key={i} style={{ padding: '5px 6px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold', border: '1px solid #cbd5e1', color: '#374151' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxRows }).map((_, row) => {
          const lw = left[row]; const rw = right[row]
          const bg = row % 2 === 0 ? 'white' : '#f8fafc'
          return (
            <tr key={row}>
              <td style={{ ...numStyle, background: bg }}>{lw ? String(lw.seq).padStart(2, '0') : ''}</td>
              <td style={{ ...cellStyle, background: bg, fontWeight: '500', textAlign: 'center' }}>{lw ? getDisplay(lw) : ''}</td>
              <td style={{ ...dividerStyle, background: bg }} />
              <td style={{ ...numStyle, background: bg }}>{rw ? String(rw.seq).padStart(2, '0') : ''}</td>
              <td style={{ ...cellStyle, background: bg, fontWeight: '500', textAlign: 'center' }}>{rw ? getDisplay(rw) : ''}</td>
              <td style={{ ...cellStyle, background: bg }} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Mixed table (left=meaning, right=spelling) ───────────────────────────────

function MixedTable({ left, right, maxRows }: { left: Word[]; right: Word[]; maxRows: number }) {
  const cellStyle: React.CSSProperties = {
    padding: '6px 6px', border: '1px solid #e2e8f0', fontSize: '10pt',
  }
  const numStyle: React.CSSProperties = {
    ...cellStyle, textAlign: 'center', color: '#6b7280', fontSize: '9pt',
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '6%' }} /><col style={{ width: '22%' }} /><col style={{ width: '22%' }} />
        <col style={{ width: '6%' }} /><col style={{ width: '22%' }} /><col style={{ width: '22%' }} />
      </colgroup>
      <thead>
        <tr>
          {/* Left half header: Meaning */}
          <th colSpan={3} style={{ padding: '4px 6px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold', border: '1px solid #cbd5e1', background: '#eff6ff', color: '#1e40af' }}>
            ★ 뜻 쓰기 (영어 → 한글)
          </th>
          {/* Right half header: Spelling */}
          <th colSpan={3} style={{ padding: '4px 6px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold', border: '1px solid #cbd5e1', background: '#fdf4ff', color: '#7e22ce' }}>
            ★ 철자 쓰기 (한글 → 영어)
          </th>
        </tr>
        <tr style={{ background: '#f1f5f9' }}>
          {['No', '영어', '뜻', 'No', '뜻', '영어 철자'].map((h, i) => (
            <th key={i} style={{ padding: '4px 6px', textAlign: 'center', fontSize: '9pt', fontWeight: 'bold', border: '1px solid #cbd5e1', color: '#374151' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: maxRows }).map((_, row) => {
          const lw = left[row]; const rw = right[row]
          const bg = row % 2 === 0 ? 'white' : '#f8fafc'
          return (
            <tr key={row}>
              {/* Left: Meaning (show English, blank Korean) */}
              <td style={{ ...numStyle, background: bg }}>{lw ? String(lw.seq).padStart(2, '0') : ''}</td>
              <td style={{ ...cellStyle, background: bg, fontWeight: '500', textAlign: 'center' }}>{lw?.english ?? ''}</td>
              <td style={{ ...cellStyle, background: bg }} />
              {/* Right: Spelling (show Korean, blank English) */}
              <td style={{ ...numStyle, background: bg }}>{rw ? String(rw.seq).padStart(2, '0') : ''}</td>
              <td style={{ ...cellStyle, background: bg, fontWeight: '500', textAlign: 'center' }}>{rw?.korean ?? ''}</td>
              <td style={{ ...cellStyle, background: bg }} />
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
