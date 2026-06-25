import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, User, Users, BookOpen } from 'lucide-react'
import { grammarApi } from '../api/client'
import { useGrammarStore } from '../store/grammarStore'
import type { GrammarCategory, GrammarTeacher, GrammarClass } from '../types'

// ── Cascading category selector ───────────────────────────────────────────

function CategoryTree({
  categories,
  selected,
  onChange,
}: {
  categories: GrammarCategory[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [openParents, setOpenParents] = useState<Set<string>>(new Set())
  const parents = categories.filter((c) => c.depth === 1)
  const children = (parentCode: string) =>
    categories.filter((c) => {
      const parent = categories.find((p) => p.code === parentCode)
      return c.parent_id === parent?.id
    })

  const toggleParent = (code: string) => {
    setOpenParents((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const toggleChild = (code: string) => {
    const next = new Set(selected)
    next.has(code) ? next.delete(code) : next.add(code)
    onChange(next)
  }

  const toggleAllChildren = (parentCode: string) => {
    const kids = children(parentCode).map((c) => c.code)
    const allOn = kids.every((k) => selected.has(k))
    const next = new Set(selected)
    if (allOn) {
      kids.forEach((k) => next.delete(k))
    } else {
      kids.forEach((k) => next.add(k))
    }
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {parents.map((parent) => {
        const kids = children(parent.code)
        const selectedKids = kids.filter((k) => selected.has(k.code)).length
        const allSelected = selectedKids === kids.length
        const open = openParents.has(parent.code)

        return (
          <div key={parent.code} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer select-none"
              onClick={() => toggleParent(parent.code)}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleAllChildren(parent.code) }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                  ${allSelected ? 'bg-indigo-600 border-indigo-600' : selectedKids > 0 ? 'bg-indigo-200 border-indigo-400' : 'border-slate-300'}`}
              >
                {(allSelected || selectedKids > 0) && (
                  <span className="text-white text-xs font-bold">
                    {allSelected ? '✓' : '–'}
                  </span>
                )}
              </button>
              <span className="font-semibold text-slate-700 flex-1">{parent.name_ko}</span>
              <span className="text-xs text-slate-400">{selectedKids}/{kids.length}</span>
              {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </div>

            {open && (
              <div className="px-4 py-2 grid grid-cols-1 gap-1 bg-white">
                {kids.map((kid) => (
                  <label key={kid.code} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <div
                      onClick={() => toggleChild(kid.code)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer
                        ${selected.has(kid.code) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}
                    >
                      {selected.has(kid.code) && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className="text-sm text-slate-600">{kid.name_ko}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Teacher / Class picker ────────────────────────────────────────────────

function TeacherClassPicker({
  teachers, classes,
  selectedTeacher, selectedClass,
  onTeacher, onClass,
  onNewTeacher, onNewClass,
}: {
  teachers: GrammarTeacher[]
  classes: GrammarClass[]
  selectedTeacher: GrammarTeacher | null
  selectedClass: GrammarClass | null
  onTeacher: (t: GrammarTeacher) => void
  onClass: (c: GrammarClass) => void
  onNewTeacher: (name: string) => void
  onNewClass: (name: string) => void
}) {
  const [newTeacherName, setNewTeacherName] = useState('')
  const [newClassName, setNewClassName] = useState('')
  const [addTeacher, setAddTeacher] = useState(false)
  const [addClass, setAddClass] = useState(false)

  return (
    <div className="space-y-4">
      {/* Teacher */}
      <div>
        <label className="text-sm font-semibold text-slate-600 mb-2 block flex items-center gap-1">
          <User size={14} /> 선생님
        </label>
        <div className="flex flex-wrap gap-2">
          {teachers.map((t) => (
            <button
              key={t.id}
              onClick={() => onTeacher(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${selectedTeacher?.id === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
            >
              {t.name}
            </button>
          ))}
          {!addTeacher ? (
            <button
              onClick={() => setAddTeacher(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 flex items-center gap-1"
            >
              <Plus size={14} /> 추가
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (newTeacherName.trim()) { onNewTeacher(newTeacherName.trim()); setNewTeacherName(''); setAddTeacher(false) } }} className="flex gap-2">
              <input
                autoFocus
                value={newTeacherName}
                onChange={(e) => setNewTeacherName(e.target.value)}
                placeholder="이름 입력"
                className="border border-indigo-400 rounded-lg px-3 py-1.5 text-sm w-32 outline-none"
              />
              <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">확인</button>
              <button type="button" onClick={() => setAddTeacher(false)} className="text-slate-400 text-sm px-2">취소</button>
            </form>
          )}
        </div>
      </div>

      {/* Class */}
      {selectedTeacher && (
        <div>
          <label className="text-sm font-semibold text-slate-600 mb-2 block flex items-center gap-1">
            <Users size={14} /> 반
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.filter((c) => c.teacher_id === selectedTeacher.id).map((c) => (
              <button
                key={c.id}
                onClick={() => onClass(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                  ${selectedClass?.id === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
              >
                {c.name}
              </button>
            ))}
            {!addClass ? (
              <button
                onClick={() => setAddClass(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 flex items-center gap-1"
              >
                <Plus size={14} /> 추가
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (newClassName.trim()) { onNewClass(newClassName.trim()); setNewClassName(''); setAddClass(false) } }} className="flex gap-2">
                <input
                  autoFocus
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="반 이름"
                  className="border border-indigo-400 rounded-lg px-3 py-1.5 text-sm w-32 outline-none"
                />
                <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">확인</button>
                <button type="button" onClick={() => setAddClass(false)} className="text-slate-400 text-sm px-2">취소</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main GrammarSetup ─────────────────────────────────────────────────────

export default function GrammarSetup() {
  const navigate = useNavigate()
  const { setConfig } = useGrammarStore()

  const [categories, setCategories] = useState<GrammarCategory[]>([])
  const [teachers, setTeachers] = useState<GrammarTeacher[]>([])
  const [classes, setClasses] = useState<GrammarClass[]>([])

  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [selectedTeacher, setSelectedTeacher] = useState<GrammarTeacher | null>(null)
  const [selectedClass, setSelectedClass] = useState<GrammarClass | null>(null)

  const [count, setCount] = useState(5)
  const [mcq, setMcq] = useState(false)
  const [displayMode, setDisplayMode] = useState<'panel' | 'flashcard'>('panel')
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const [saveHistory, setSaveHistory] = useState(true)

  useEffect(() => {
    grammarApi.categories().then(setCategories)
    grammarApi.teachers().then(setTeachers)
    grammarApi.classes().then(setClasses)
  }, [])

  const handleNewTeacher = async (name: string) => {
    const t = await grammarApi.createTeacher(name)
    setTeachers((prev) => [...prev, t])
    setSelectedTeacher(t)
    setSelectedClass(null)
  }

  const handleNewClass = async (name: string) => {
    if (!selectedTeacher) return
    const c = await grammarApi.createClass(selectedTeacher.id, name)
    setClasses((prev) => [...prev, c])
    setSelectedClass(c)
  }

  const handleTeacher = (t: GrammarTeacher) => {
    setSelectedTeacher(t)
    setSelectedClass(null)
  }

  const canStart = selectedCodes.size > 0

  const handleStart = () => {
    setConfig({
      teacher: selectedTeacher,
      grammarClass: selectedClass,
      categoryCodes: Array.from(selectedCodes),
      count,
      mcq,
      displayMode: count === 1 ? 'flashcard' : displayMode,
      timerSeconds,
      saveHistory: !!(selectedClass && saveHistory),
    })
    navigate('/grammar/quiz')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <BookOpen className="text-violet-600" size={24} />
        <h1 className="text-xl font-bold text-slate-800">문법 오답 찾기</h1>
        <button
          onClick={() => navigate('/')}
          className="ml-auto text-sm text-slate-400 hover:text-slate-600"
        >
          ← 홈
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* 1. Teacher / Class */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-4">1. 선생님 / 반 선택 (선택사항)</h2>
          <TeacherClassPicker
            teachers={teachers}
            classes={classes}
            selectedTeacher={selectedTeacher}
            selectedClass={selectedClass}
            onTeacher={handleTeacher}
            onClass={setSelectedClass}
            onNewTeacher={handleNewTeacher}
            onNewClass={handleNewClass}
          />
          {selectedClass && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveHistory}
                onChange={(e) => setSaveHistory(e.target.checked)}
                className="accent-indigo-600"
              />
              <span className="text-sm text-slate-600">퀴즈 후 출제 이력 저장</span>
            </label>
          )}
        </section>

        {/* 2. Grammar categories */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-1">2. 문법 선택</h2>
          <p className="text-xs text-slate-400 mb-3">
            선택된 항목: {selectedCodes.size}개 &nbsp;
            <button onClick={() => {
              const all = new Set(categories.filter((c) => c.depth === 2).map((c) => c.code))
              setSelectedCodes(all)
            }} className="text-indigo-500 underline">전체 선택</button>
            &nbsp;/&nbsp;
            <button onClick={() => setSelectedCodes(new Set())} className="text-slate-400 underline">전체 해제</button>
          </p>
          <CategoryTree categories={categories} selected={selectedCodes} onChange={setSelectedCodes} />
        </section>

        {/* 3. Options */}
        <section>
          <h2 className="text-base font-bold text-slate-700 mb-4">3. 출제 옵션</h2>
          <div className="space-y-4">

            {/* Count */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-24">문제 수</span>
              <div className="flex gap-2 flex-wrap">
                {[1, 3, 5, 7, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setCount(n); if (n === 1) setDisplayMode('flashcard') }}
                    className={`w-10 h-10 rounded-lg font-semibold text-sm border transition-colors
                      ${count === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-16 h-10 border border-slate-300 rounded-lg text-center text-sm outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Display mode */}
            {count > 1 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 w-24">화면 방식</span>
                <div className="flex gap-2">
                  {(['panel', 'flashcard'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setDisplayMode(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${displayMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                    >
                      {m === 'panel' ? '패널 (동시 표시)' : '플래시카드 (1개씩)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MCQ */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-24">객관식</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setMcq(!mcq)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer
                    ${mcq ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${mcq ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-slate-500">{mcq ? '객관식 4지선다 활성화' : '서술형 (오류 찾아 고쳐쓰기)'}</span>
              </label>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 w-24">타이머</span>
              <div className="flex gap-2 flex-wrap">
                {[null, 5, 10, 15, 20, 30].map((s) => (
                  <button
                    key={s ?? 'off'}
                    onClick={() => setTimerSeconds(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                      ${timerSeconds === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:border-indigo-400'}`}
                  >
                    {s ? `${s}초` : 'OFF'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="w-full py-4 bg-violet-600 text-white rounded-xl font-bold text-lg hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          시작
        </button>
      </main>
    </div>
  )
}
