'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { StoryYear, ScheduleEntry, StoryChapterNote, ChapterBlock } from '@/lib/types'
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
      return (
        e.title.toLowerCase().includes(q) ||
        (e.summary ?? '').toLowerCase().includes(q)
      )
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
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-picker-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 id="entry-picker-title" className="text-base font-bold text-slate-800">
            エントリを引用
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトルで検索..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              該当するエントリがありません
            </p>
          ) : (
            filtered.map((entry) => {
              const isOfficial = entry.type === 'official'
              const monthName = getMonthName(entry.monthId)
              const dayLabel = entry.startDay !== undefined ? `${entry.startDay}日` : ''
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-sky-50 transition-colors border border-transparent hover:border-sky-200"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        isOfficial
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {isOfficial ? '公式' : '出来事'}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {monthName}{dayLabel && ` ${dayLabel}`}
                    </span>
                    <span className="text-sm text-slate-800 font-medium truncate">
                      {entry.title}
                    </span>
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

// ===== テキストブロック =====

function TextBlock({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: ChapterBlock & { type: 'text' }
  onUpdate: (content: string) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
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
    <div className="relative group bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && <button type="button" onClick={onMoveUp} className="text-slate-400 hover:text-slate-600 w-5 h-5 flex items-center justify-center text-xs" aria-label="上へ">▲</button>}
        {onMoveDown && <button type="button" onClick={onMoveDown} className="text-slate-400 hover:text-slate-600 w-5 h-5 flex items-center justify-center text-xs" aria-label="下へ">▼</button>}
        <button type="button" onClick={onDelete} className="text-slate-400 hover:text-red-500 w-5 h-5 flex items-center justify-center text-base leading-none" aria-label="削除">×</button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        rows={2}
        placeholder="テキストを入力..."
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onUpdate(value)}
        className="w-full bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder-sky-300 pr-16"
      />
    </div>
  )
}

// ===== エントリ参照ブロック =====

function EntryRefBlock({
  entryId,
  entries,
  year,
  onDelete,
}: {
  entryId: string
  entries: ScheduleEntry[]
  year: StoryYear
  onDelete: () => void
}) {
  const router = useRouter()
  const entry = entries.find((e) => e.id === entryId)

  if (!entry) {
    return (
      <div className="relative group bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={onDelete} className="text-slate-400 hover:text-red-500 w-5 h-5 flex items-center justify-center text-base leading-none" aria-label="削除">×</button>
        </div>
        <span className="text-sm text-slate-400 italic">[削除済みエントリ]</span>
      </div>
    )
  }

  const isOfficial = entry.type === 'official'
  const monthName = year.months.find((m) => m.id === entry.monthId)?.name ?? ''
  const dayLabel = entry.startDay !== undefined ? ` ${entry.startDay}日` : ''

  const detailPath = `/schedule/${isOfficial ? 'official' : 'plot'}/detail?id=${entry.id}`

  return (
    <div className="relative group bg-white border border-slate-200 rounded-lg px-3 py-2">
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={onDelete} className="text-slate-400 hover:text-red-500 w-5 h-5 flex items-center justify-center text-base leading-none" aria-label="削除">×</button>
      </div>
      <button
        type="button"
        onClick={() => router.push(detailPath)}
        className="flex items-center gap-2 pr-16 w-full text-left hover:opacity-70 transition-opacity"
      >
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${isOfficial ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
          {isOfficial ? '公式' : '出来事'}
        </span>
        <span className="text-xs text-slate-500 shrink-0">{monthName}{dayLabel}</span>
        <span className="text-sm font-medium text-slate-800 truncate">{entry.title}</span>
      </button>
    </div>
  )
}

// ===== 章エディタ =====

function ChapterEditor({
  chapter,
  entries,
  year,
  onChange,
}: {
  chapter: StoryChapterNote
  entries: ScheduleEntry[]
  year: StoryYear
  onChange: (updated: StoryChapterNote) => void
}) {
  const [showEntryPicker, setShowEntryPicker] = useState(false)
  const [chapterName, setChapterName] = useState(chapter.name)

  // 章が切り替わったときに名前を同期
  useEffect(() => {
    setChapterName(chapter.name)
  }, [chapter.id, chapter.name])

  const handleNameBlur = useCallback(() => {
    if (chapterName.trim() === chapter.name) return
    const updated: StoryChapterNote = {
      ...chapter,
      name: chapterName.trim() || chapter.name,
      updatedAt: now(),
    }
    onChange(updated)
  }, [chapter, chapterName, onChange])

  const handleAddEntryRef = useCallback(
    (entry: ScheduleEntry) => {
      const newBlock: ChapterBlock = {
        id: generateId(),
        type: 'entry-ref',
        entryId: entry.id,
      }
      const updated: StoryChapterNote = {
        ...chapter,
        blocks: [...chapter.blocks, newBlock],
        updatedAt: now(),
      }
      onChange(updated)
      setShowEntryPicker(false)
    },
    [chapter, onChange]
  )

  const handleAddTextBlock = useCallback(() => {
    const newBlock: ChapterBlock = {
      id: generateId(),
      type: 'text',
      content: '',
    }
    const updated: StoryChapterNote = {
      ...chapter,
      blocks: [...chapter.blocks, newBlock],
      updatedAt: now(),
    }
    onChange(updated)
  }, [chapter, onChange])

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      const updated: StoryChapterNote = {
        ...chapter,
        blocks: chapter.blocks.filter((b) => b.id !== blockId),
        updatedAt: now(),
      }
      onChange(updated)
    },
    [chapter, onChange]
  )

  const handleUpdateTextBlock = useCallback(
    (blockId: string, content: string) => {
      const updated: StoryChapterNote = {
        ...chapter,
        blocks: chapter.blocks.map((b) =>
          b.id === blockId && b.type === 'text' ? { ...b, content } : b
        ),
        updatedAt: now(),
      }
      onChange(updated)
    },
    [chapter, onChange]
  )

  // エントリを日付順にソート、テキストは相対位置を維持
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

  const handleMoveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const idx = displayBlocks.findIndex((b) => b.id === blockId)
      if (idx < 0) return
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= displayBlocks.length) return
      const blocks = [...displayBlocks]
      ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
      onChange({ ...chapter, blocks, updatedAt: now() })
    },
    [chapter, displayBlocks, onChange]
  )

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

      {/* ブロック一覧 */}
      <div className="space-y-2 flex-1">
        {displayBlocks.length === 0 && (
          <p className="text-sm text-slate-400 py-4 text-center">
            エントリを引用するか、テキストを追加してください
          </p>
        )}
        {displayBlocks.map((block, idx) => {
          const isFirst = idx === 0
          const isLast = idx === displayBlocks.length - 1
          if (block.type === 'entry-ref') {
            return (
              <EntryRefBlock
                key={block.id}
                entryId={block.entryId}
                entries={entries}
                year={year}
                onDelete={() => handleDeleteBlock(block.id)}
              />
            )
          }
          if (block.type === 'text') {
            return (
              <TextBlock
                key={block.id}
                block={block}
                onUpdate={(content) => handleUpdateTextBlock(block.id, content)}
                onDelete={() => handleDeleteBlock(block.id)}
                onMoveUp={isFirst ? undefined : () => handleMoveBlock(block.id, 'up')}
                onMoveDown={isLast ? undefined : () => handleMoveBlock(block.id, 'down')}
              />
            )
          }
          return null
        })}
      </div>

      {/* 追加ボタン */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowEntryPicker(true)}
          className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + エントリを引用
        </button>
        <button
          type="button"
          onClick={handleAddTextBlock}
          className="px-3 py-1.5 text-xs text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
        >
          + テキストを追加
        </button>
      </div>

      {showEntryPicker && (
        <EntryPickerModal
          entries={entries}
          year={year}
          onSelect={handleAddEntryRef}
          onClose={() => setShowEntryPicker(false)}
        />
      )}
    </div>
  )
}

// ===== メインコンポーネント =====

type Props = {
  selectedYear: StoryYear
  allEntries: ScheduleEntry[]
  onToast: (msg: string, type: 'success' | 'error') => void
}

export default function ChapterView({ selectedYear, allEntries, onToast }: Props) {
  const [chapters, setChapters] = useState<StoryChapterNote[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const reloadChapters = useCallback(() => {
    const loaded = loadChapters(selectedYear.id)
    setChapters(loaded)
  }, [selectedYear.id])

  // 年が変わったらリロード
  useEffect(() => {
    const loaded = loadChapters(selectedYear.id)
    setChapters(loaded)
    if (loaded.length > 0) {
      setSelectedChapterId((prev) => {
        // 既存の選択が有効なら維持
        if (prev && loaded.some((c) => c.id === prev)) return prev
        return loaded[0].id
      })
    } else {
      setSelectedChapterId(null)
    }
  }, [selectedYear.id])

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? null

  // 章を追加
  const handleAddChapter = useCallback(() => {
    const newChapter: StoryChapterNote = {
      id: generateId(),
      yearId: selectedYear.id,
      name: `第${chapters.length + 1}章`,
      blocks: [],
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

  // 章を削除
  const handleDeleteChapter = useCallback(
    (id: string) => {
      deleteChapter(id)
      const updated = loadChapters(selectedYear.id)
      setChapters(updated)
      if (selectedChapterId === id) {
        setSelectedChapterId(updated.length > 0 ? updated[0].id : null)
      }
    },
    [selectedChapterId, selectedYear.id]
  )

  // 章の変更を保存
  const handleChapterChange = useCallback((updated: StoryChapterNote) => {
    saveChapter(updated)
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }, [])

  // 年のエントリのみ絞り込み
  const yearEntries = allEntries.filter((e) => e.yearId === selectedYear.id)

  // ===== サイドバー =====
  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          章一覧
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {chapters.length === 0 && (
          <p className="text-xs text-slate-400 py-3 text-center">
            章がありません
          </p>
        )}
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
              chapter.id === selectedChapterId
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => {
              setSelectedChapterId(chapter.id)
              setShowMobileSidebar(false)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedChapterId(chapter.id)
                setShowMobileSidebar(false)
              }
            }}
            aria-current={chapter.id === selectedChapterId ? 'true' : undefined}
          >
            <span className="flex-1 text-sm truncate">{chapter.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteChapter(chapter.id)
              }}
              className="shrink-0 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-base leading-none"
              aria-label={`${chapter.name}を削除`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddChapter}
        className="mt-3 w-full px-3 py-2 text-xs text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors text-center"
      >
        + 章を追加
      </button>
    </div>
  )

  return (
    <div className="flex gap-0 min-h-[60vh]">
      {/* デスクトップ サイドバー */}
      <aside className="hidden sm:flex flex-col w-56 shrink-0 bg-white border border-slate-200 rounded-xl p-3 mr-4 self-start sticky top-20">
        {sidebar}
      </aside>

      {/* モバイル: 章選択ボタン + ドロワー */}
      <div className="sm:hidden w-full mb-3">
        <button
          type="button"
          onClick={() => setShowMobileSidebar(true)}
          className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700"
        >
          <span className="truncate">
            {selectedChapter ? selectedChapter.name : '章を選択...'}
          </span>
          <span className="text-slate-400 ml-2" aria-hidden="true">▼</span>
        </button>
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800">章一覧</span>
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {sidebar}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メインエリア */}
      <main className="flex-1 min-w-0">
        {!selectedChapter ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📖</div>
            <p className="text-slate-500 text-sm mb-4">
              章を追加して整理しましょう
            </p>
            <button
              type="button"
              onClick={handleAddChapter}
              className="px-4 py-2 text-sm font-medium text-sky-600 border border-sky-300 rounded-xl hover:bg-sky-50 transition-colors"
            >
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
              onChange={handleChapterChange}
            />
          </div>
        )}
      </main>
    </div>
  )
}
