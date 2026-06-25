import { useRef } from 'react'
import { X } from 'lucide-react'
import type { GrammarQuestion } from '../types'

interface Props {
  questions: GrammarQuestion[]
  mcq: boolean
  className?: string
  onClose: () => void
}

export default function GrammarPrintView({ questions, mcq, className, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => window.print()

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
        {/* Toolbar (not printed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b print:hidden">
          <h2 className="text-lg font-bold text-slate-800">시험지 미리보기</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-violet-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
              인쇄
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Print content */}
        <div className="overflow-auto flex-1">
          <div ref={printRef} className="p-10 print:p-8" id="grammar-print-area">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">문법 오답 찾기</h1>
              <div className="flex items-center justify-between text-sm text-slate-500 mt-2">
                <span>{className || ''}</span>
                <span>{today}</span>
                <span>이름: ________________</span>
              </div>
            </div>

            {/* Instructions */}
            <p className="text-sm text-slate-600 mb-6 italic">
              {mcq
                ? '다음 문장에서 밑줄 친 부분 중 문법상 틀린 것을 찾아 올바르게 고친 것을 보기에서 고르시오.'
                : '다음 문장에서 문법상 틀린 부분을 찾아 올바르게 고쳐 쓰시오.'}
            </p>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex gap-3">
                    <span className="font-bold text-slate-800 shrink-0">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-slate-800 leading-relaxed">
                        {q.error_sentence.split(q.error_word).map((part, idx, arr) => (
                          idx < arr.length - 1 ? (
                            <span key={idx}>
                              {part}
                              <span className="underline font-semibold">{q.error_word}</span>
                            </span>
                          ) : <span key={idx}>{part}</span>
                        ))}
                      </p>

                      {/* MCQ options */}
                      {mcq && q.mcq_options && (
                        <div className="mt-2 grid grid-cols-4 gap-2 text-sm text-slate-700">
                          {q.mcq_options.map((opt, oi) => (
                            <span key={oi}>
                              <span className="font-bold mr-1">{String.fromCharCode(65 + oi)}.</span>{opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Answer line (서술형) */}
                      {!mcq && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <span>→ 틀린 부분:</span>
                          <span className="border-b border-slate-400 w-24 inline-block" />
                          <span>정답:</span>
                          <span className="border-b border-slate-400 w-24 inline-block" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Answer key (separate) */}
            <div className="mt-12 pt-6 border-t border-dashed border-slate-300">
              <h3 className="font-bold text-slate-700 mb-4 text-sm">[ 정답 ]</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex gap-2">
                    <span className="font-bold shrink-0">{i + 1}.</span>
                    {mcq && q.mcq_options ? (
                      <span>
                        {String.fromCharCode(65 + q.mcq_options.indexOf(q.correct_word))}
                        {' '}({q.error_word} → {q.correct_word})
                      </span>
                    ) : (
                      <span>{q.error_word} → {q.correct_word}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #grammar-print-area, #grammar-print-area * { visibility: visible !important; }
          #grammar-print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
