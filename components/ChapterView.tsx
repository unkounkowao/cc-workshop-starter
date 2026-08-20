'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { StoryYear, ScheduleEntry, StoryChapterNote, ChapterBlock, Character, CharacterPsychology } from '@/lib/types'
import {
  loadChapters,
  saveChapter,
  deleteChapter,
  getNextChapterSortOrder,
} from '@/lib/chapterStorage'
import { generateId, now } from '@/lib/utils'

// ===== エントリ引用選択モーダル =====

function EntryPickerModal({
  entries,
  year,
  onSelect,
  onClose,
}: {
  entries: ScheduleEntry[]
  year: StoryYear
  onSelect: (entry: ScheduleEntry) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = entries
    .filter((e) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return e.title.toLowerCase().includes(q) || (e.summary ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const mA = year.months.find((m) => m.id === a.monthId)?.monthNumber ?? 0
      const mB = year.months.find((m) => m.id === b.monthId)?.monthNumber ?? 0
      if (mA !== mB) return mA - mB
      return (a.startDay ?? 0) - (b.startDay ?? 0)
    })

  function getMonthName(monthId: string): string {
    return year.months.find((m) => m.id === monthId)?.name ?? ''
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">エントリを引用</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="タイトルで検索..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" autoFocus />
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">該当するエントリがありません</p>
          ) : (
            filtered.map((entry) => {
              const isOfficial = entry.type === 'official'
              const monthName = getMonthName(entry.monthId)
              const dayLabel = entry.startDay !== undefined ? `${entry.startDay}日` : ''
              return (
                <button key={entry.id} type="button" onClick={() => onSelect(entry)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-sky-50 transition-colors border border-transparent hover:border-sky-200">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${isOfficial ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                      {isOfficial ? '公式' : '出来事'}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">{monthName}{dayLabel && ` ${dayLabel}`}</span>
                    <span className="text-sm text-slate-800 font-medium truncate">{entry.title}</span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ===== キャラクター列追加モーダル =====

function CharacterPickerModal({
  characters,
  excludeIds,
  onSelect,
  onClose,
}: {
  characters: Character[]
  excludeIds: string[]
  onSelect: (character: Character) => void
  onClose: () => void
}) {
  const available = characters.filter((c) => !excludeIds.includes(c.id))
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs flex flex-col max-h-[70vh]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">キャラクターを列に追加</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {available.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">追加できるキャラクターがありません</p>
          ) : (
            available.map((c) => (
              <button key={c.id} type="button" onClick={() => onSelect(c)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-sky-50 transition-colors text-sm text-slate-800">
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 心理テキスト入力（ローカルstate管理）=====

function PsychologyCell({
  value,
  onBlur,
}: {
  value: string
  onBlur: (v: string) => void
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])

  return (
    <textarea
      value={local}
      rows={3}
      placeholder="—"
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onBlur(local)}
      className="w-full text-xs text-slate-700 border border-slate-100 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-sky-300 focus:border-sky-300 placeholder-slate-200 bg-slate-50 focus:bg-white transition-colors"
    />
  )
}

// ===== テキストブロック =====

function TextBlock({
  block,
  colSpan,
  onUpdate,
  onDelete,
}: {
  block: ChapterBlock & { type: 'text' }
  colSpan: number
  onUpdate: (content: string) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(block.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <tr className="border-t border-slate-100">
      <td colSpan={colSpan} className="px-3 py-2">
        <div className="relative group bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          <button type="button" onClick={onDelete} className="absolute top-1.5 right-1.5 text-slate-300 hover:text-red-500 w-5 h-5 flex items-center justify-center text-base leading-none sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">×</button>
          <textarea
            ref={textareaRef}
            value={value}
            rows={2}
            placeholder="テキストを入力..."
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onUpdate(value)}
            className="w-full bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder-sky-300 pr-6"
          />
        </div>
      </td>
    </tr>
  )
}

// ===== 章エディタ（テーブル形式）=====

function ChapterEditor({
  chapter,
  entries,
  year,
  characters,
  onChange,
}: {
  chapter: StoryChapterNote
  entries: ScheduleEntry[]
  year: StoryYear
  characters: Character[]
  onChange: (updated: StoryChapterNote) => void
}) {
  const router = useRouter()
  const [showEntryPicker, setShowEntryPicker] = useState(false)
  const [showCharPicker, setShowCharPicker] = useState(false)
  const [chapterName, setChapterName] = useState(chapter.name)

  useEffect(() => { setChapterName(chapter.name) }, [chapter.id, chapter.name])

  const characterIds = chapter.characterIds ?? []

  const handleNameBlur = useCallback(() => {
    if (chapterName.trim() === chapter.name) return
    onChange({ ...chapter, name: chapterName.trim() || chapter.name, updatedAt: now() })
  }, [chapter, chapterName, onChange])

  // キャラを列に追加
  const handleAddCharacter = useCallback((char: Character) => {
    onChange({ ...chapter, characterIds: [...characterIds, char.id], updatedAt: now() })
    setShowCharPicker(false)
  }, [chapter, characterIds, onChange])

  // キャラ列を削除
  const handleRemoveCharacter = useCallback((charId: string) => {
    onChange({ ...chapter, characterIds: characterIds.filter((id) => id !== charId), updatedAt: now() })
  }, [chapter, characterIds, onChange])

  // エントリを行に追加
  const handleAddEntryRef = useCallback((entry: ScheduleEntry) => {
    const newBlock: ChapterBlock = { id: generateId(), type: 'entry-ref', entryId: entry.id, characterPsychologies: [] }
    onChange({ ...chapter, blocks: [...chapter.blocks, newBlock], updatedAt: now() })
    setShowEntryPicker(false)
  }, [chapter, onChange])

  // テキストブロック追加
  const handleAddTextBlock = useCallback(() => {
    const newBlock: ChapterBlock = { id: generateId(), type: 'text', content: '' }
    onChange({ ...chapter, blocks: [...chapter.blocks, newBlock], updatedAt: now() })
  }, [chapter, onChange])

  // ブロック削除
  const handleDeleteBlock = useCallback((blockId: string) => {
    onChange({ ...chapter, blocks: chapter.blocks.filter((b) => b.id !== blockId), updatedAt: now() })
  }, [chapter, onChange])

  // テキストブロック更新
  const handleUpdateTextBlock = useCallback((blockId: string, content: string) => {
    onChange({ ...chapter, blocks: chapter.blocks.map((b) => b.id === blockId && b.type === 'text' ? { ...b, content } : b), updatedAt: now() })
  }, [chapter, onChange])

  // 心理テキスト更新
  const handleUpdatePsychology = useCallback((blockId: string, charId: string, psychology: string) => {
    onChange({
      ...chapter,
      blocks: chapter.blocks.map((b) => {
        if (b.id !== blockId || b.type !== 'entry-ref') return b
        const existing = b.characterPsychologies ?? []
        const idx = existing.findIndex((p) => p.characterId === charId)
        const updated: CharacterPsychology[] = idx >= 0
          ? existing.map((p, i) => i === idx ? { ...p, psychology } : p)
          : [...existing, { characterId: charId, psychology }]
        return { ...b, characterPsychologies: updated }
      }),
      updatedAt: now(),
    })
  }, [chapter, onChange])

  // エントリを日付順にソート、テキストは相対位置を保持
  const displayBlocks = useMemo(() => {
    const getScore = (entryId: string) => {
      const entry = entries.find((e) => e.id === entryId)
      if (!entry) return Infinity
      const month = year.months.find((m) => m.id === entry.monthId)
      return (month?.monthNumber ?? 0) * 1000 + (entry.startDay ?? 0)
    }
    const entryRefsSorted = chapter.blocks
      .filter((b): b is ChapterBlock & { type: 'entry-ref' } => b.type === 'entry-ref')
      .sort((a, b) => getScore(a.entryId) - getScore(b.entryId))
    const result: ChapterBlock[] = []
    let refIdx = 0
    for (const block of chapter.blocks) {
      if (block.type === 'entry-ref') {
        if (refIdx < entryRefsSorted.length) result.push(entryRefsSorted[refIdx++])
      } else {
        result.push(block)
      }
    }
    while (refIdx < entryRefsSorted.length) result.push(entryRefsSorted[refIdx++])
    return result
  }, [chapter.blocks, entries, year])

  // テーブルの総列数（出来事列 + キャラ列 + 削除列）
  const totalCols = 1 + characterIds.length + 1

  return (
    <div className="flex flex-col h-full">
      {/* 章名 */}
      <div className="mb-4">
        <input
          type="text"
          value={chapterName}
          onChange={(e) => setChapterName(e.target.value)}
          onBlur={handleNameBlur}
          className="w-full text-xl font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-sky-400 focus:outline-none px-1 py-0.5 transition-colors bg-transparent"
          aria-label="章の名前"
        />
      </div>

      {/* テーブル（横スクロール対応）*/}
      <div className="overflow-x-auto flex-1">
        <table className="border-collapse" style={{ minWidth: characterIds.length > 0 ? `${200 + characterIds.length * 160}px` : '100%' }}>
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 w-48 min-w-[180px]">
                出来事
              </th>
              {characterIds.map((charId) => {
                const char = characters.find((c) => c.id === charId)
                return (
                  <th key={charId} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200 min-w-[150px] w-40">
                    <div className="flex items-center gap-1">
                      <span className="truncate">{char?.name ?? '(削除済み)'}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCharacter(charId)}
                        className="shrink-0 text-slate-300 hover:text-red-400 text-xs leading-none ml-auto"
                        aria-label="列を削除"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                )
              })}
              <th className="px-2 py-2 border-b border-slate-200 w-8">
                <button
                  type="button"
                  onClick={() => setShowCharPicker(true)}
                  className="text-xs text-sky-500 hover:text-sky-700 whitespace-nowrap"
                  title="キャラクターを列に追加"
                >
                  + 列
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBlocks.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="text-center text-sm text-slate-400 py-10">
                  エントリを引用して行を追加してください
                </td>
              </tr>
            )}
            {displayBlocks.map((block) => {
              if (block.type === 'text') {
                return (
                  <TextBlock
                    key={block.id}
                    block={block}
                    colSpan={totalCols}
                    onUpdate={(content) => handleUpdateTextBlock(block.id, content)}
                    onDelete={() => handleDeleteBlock(block.id)}
                  />
                )
              }
              if (block.type === 'entry-ref') {
                const entry = entries.find((e) => e.id === block.entryId)
                const isOfficial = entry?.type === 'official'
                const detailPath = entry
                  ? `/schedule/${isOfficial ? 'official' : 'plot'}/detail?id=${entry.id}&chapterId=${chapter.id}`
                  : null
                return (
                  <tr key={block.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    {/* 出来事列 */}
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-start gap-1">
                        {entry ? (
                          <button
                            type="button"
                            onClick={() => detailPath && router.push(detailPath)}
                            className="text-sm font-medium text-slate-800 hover:text-sky-600 transition-colors text-left leading-snug"
                          >
                            {entry.title}
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400 italic">[削除済みエントリ]</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="shrink-0 text-slate-200 hover:text-red-400 text-base leading-none mt-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-auto"
                          aria-label="行を削除"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                    {/* キャラ列 */}
                    {characterIds.map((charId) => {
                      const psych = (block.characterPsychologies ?? []).find((p) => p.characterId === charId)
                      return (
                        <td key={charId} className="px-3 py-2 align-top">
                          <PsychologyCell
                            value={psych?.psychology ?? ''}
                            onBlur={(v) => handleUpdatePsychology(block.id, charId, v)}
                          />
                        </td>
                      )
                    })}
                    <td />
                  </tr>
                )
              }
              return null
            })}
          </tbody>
        </table>
      </div>

      {/* 追加ボタン */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => setShowEntryPicker(true)} className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          + 行を追加（エントリ引用）
        </button>
        <button type="button" onClick={handleAddTextBlock} className="px-3 py-1.5 text-xs text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors">
          + テキストを追加
        </button>
      </div>

      {showEntryPicker && (
        <EntryPickerModal entries={entries} year={year} onSelect={handleAddEntryRef} onClose={() => setShowEntryPicker(false)} />
      )}
      {showCharPicker && (
        <CharacterPickerModal characters={characters} excludeIds={characterIds} onSelect={handleAddCharacter} onClose={() => setShowCharPicker(false)} />
      )}
    </div>
  )
}

// ===== メインコンポーネント =====

type Props = {
  selectedYear: StoryYear
  allEntries: ScheduleEntry[]
  characters: Character[]
  onToast: (msg: string, type: 'success' | 'error') => void
}

export default function ChapterView({ selectedYear, allEntries, characters, onToast }: Props) {
  const [chapters, setChapters] = useState<StoryChapterNote[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    const load = () => {
      const loaded = loadChapters(selectedYear.id)
      setChapters(loaded)
      setSelectedChapterId((prev) => {
        if (loaded.length === 0) return null
        if (prev && loaded.some((c) => c.id === prev)) return prev
        return loaded[0].id
      })
    }
    load()
    window.addEventListener('gist-synced', load)
    return () => window.removeEventListener('gist-synced', load)
  }, [selectedYear.id])

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null

  const handleAddChapter = useCallback(() => {
    const newChapter: StoryChapterNote = {
      id: generateId(),
      yearId: selectedYear.id,
      name: `第${chapters.length + 1}章`,
      blocks: [],
      characterIds: [],
      sortOrder: getNextChapterSortOrder(selectedYear.id),
      createdAt: now(),
      updatedAt: now(),
    }
    saveChapter(newChapter)
    const updated = loadChapters(selectedYear.id)
    setChapters(updated)
    setSelectedChapterId(newChapter.id)
    setShowMobileSidebar(false)
  }, [chapters.length, selectedYear.id])

  const handleDeleteChapter = useCallback((id: string) => {
    deleteChapter(id)
    const updated = loadChapters(selectedYear.id)
    setChapters(updated)
    if (selectedChapterId === id) {
      setSelectedChapterId(updated.length > 0 ? updated[0].id : null)
    }
  }, [selectedChapterId, selectedYear.id])

  const handleChapterChange = useCallback((updated: StoryChapterNote) => {
    saveChapter(updated)
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  const yearEntries = allEntries.filter((e) => e.yearId === selectedYear.id)

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">章一覧</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {chapters.length === 0 && <p className="text-xs text-slate-400 py-3 text-center">章がありません</p>}
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${chapter.id === selectedChapterId ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100'}`}
            onClick={() => { setSelectedChapterId(chapter.id); setShowMobileSidebar(false) }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedChapterId(chapter.id); setShowMobileSidebar(false) } }}
            aria-current={chapter.id === selectedChapterId ? 'true' : undefined}
          >
            <span className="flex-1 text-sm truncate">{chapter.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id) }}
              className="shrink-0 text-slate-300 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100 text-base leading-none"
              aria-label={`${chapter.name}を削除`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleAddChapter} className="mt-3 w-full px-3 py-2 text-xs text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors text-center">
        + 章を追加
      </button>
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row gap-0 min-h-[60vh]">
      <aside className="hidden sm:flex flex-col w-56 shrink-0 bg-white border border-slate-200 rounded-xl p-3 mr-4 self-start sticky top-20">
        {sidebar}
      </aside>

      <div className="sm:hidden mb-3">
        <button type="button" onClick={() => setShowMobileSidebar(true)} className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700">
          <span className="truncate">{selectedChapter ? selectedChapter.name : '章を選択...'}</span>
          <span className="text-slate-400 ml-2" aria-hidden="true">▼</span>
        </button>
        {showMobileSidebar && (
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileSidebar(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800">章一覧</span>
                <button type="button" onClick={() => setShowMobileSidebar(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none" aria-label="閉じる">×</button>
              </div>
              <div className="flex-1 overflow-hidden">{sidebar}</div>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 min-w-0">
        {!selectedChapter ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📖</div>
            <p className="text-slate-500 text-sm mb-4">章を追加して整理しましょう</p>
            <button type="button" onClick={handleAddChapter} className="px-4 py-2 text-sm font-medium text-sky-600 border border-sky-300 rounded-xl hover:bg-sky-50 transition-colors">
              + 章を追加
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <ChapterEditor
              key={selectedChapter.id}
              chapter={selectedChapter}
              entries={yearEntries}
              year={selectedYear}
              characters={characters}
              onChange={handleChapterChange}
            />
          </div>
        )}
      </main>
    </div>
  )
}
