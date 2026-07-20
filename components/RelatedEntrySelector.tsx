'use client'
import { useState, useEffect } from 'react'
import type { ScheduleEntry, StoryYear } from '@/lib/types'
import { loadEntries, loadYear } from '@/lib/scheduleStorage'
import { SCHEDULE_ENTRY_TYPE_LABELS } from '@/lib/constants'

type Props = {
  currentEntryId?: string
  yearId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
}

type EntryOption = ScheduleEntry & { monthName: string }

export default function RelatedEntrySelector({
  currentEntryId,
  yearId,
  selectedIds,
  onChange,
  label,
}: Props) {
  const [entries, setEntries] = useState<EntryOption[]>([])
  const [year, setYear] = useState<StoryYear | null>(null)

  useEffect(() => {
    if (!yearId) {
      setEntries([])
      setYear(null)
      return
    }
    try {
      const loadedYear = loadYear(yearId)
      setYear(loadedYear)
      const allEntries = loadEntries(yearId)
      const options: EntryOption[] = allEntries
        .filter((e) => e.id !== currentEntryId)
        .map((e) => {
          const month = loadedYear?.months.find((m) => m.id === e.monthId)
          return { ...e, monthName: month?.name ?? '不明な月' }
        })
      setEntries(options)
    } catch {
      setEntries([])
    }
  }, [yearId, currentEntryId])

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  // 月ごとにグループ化
  const monthGroups: Array<{ monthId: string; monthName: string; entries: EntryOption[] }> = []
  if (year) {
    for (const month of year.months) {
      const monthEntries = entries.filter((e) => e.monthId === month.id)
      if (monthEntries.length > 0) {
        monthGroups.push({
          monthId: month.id,
          monthName: month.name,
          entries: monthEntries,
        })
      }
    }
  }

  // 選択済みエントリ名を取得（存在しない場合は graceful に処理）
  const selectedEntries = selectedIds
    .map((id) => {
      const found = entries.find((e) => e.id === id)
      return found ? { id, title: found.title } : null
    })
    .filter((e): e is { id: string; title: string } => e !== null)

  if (!yearId) {
    return (
      <fieldset>
        {label && (
          <legend className="block text-sm font-medium text-slate-700 mb-2">{label}</legend>
        )}
        <p className="text-xs text-slate-400 py-2">先に年を選択してください。</p>
      </fieldset>
    )
  }

  return (
    <fieldset>
      {label && (
        <legend className="block text-sm font-medium text-slate-700 mb-2">{label}</legend>
      )}

      {/* 選択済みチップ */}
      {selectedEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3" aria-label="選択中の関連項目">
          {selectedEntries.map(({ id, title }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full"
            >
              <span className="max-w-[10rem] truncate">{title}</span>
              <button
                type="button"
                onClick={() => toggle(id)}
                className="ml-0.5 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 rounded-full"
                aria-label={`${title} の選択を解除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* エントリリスト */}
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          {currentEntryId
            ? 'この年に関連できる他の項目がありません。'
            : 'この年にはまだ項目がありません。'}
        </p>
      ) : (
        <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
          {monthGroups.map((group, groupIndex) => (
            <div key={group.monthId}>
              {/* 月ヘッダー */}
              <div
                className={`px-3 py-1.5 bg-slate-50 text-xs font-semibold text-slate-500 sticky top-0 ${
                  groupIndex > 0 ? 'border-t border-slate-200' : ''
                }`}
              >
                {group.monthName}
              </div>
              {/* 月内エントリ */}
              <div className="divide-y divide-slate-100">
                {group.entries.map((e) => {
                  const checked = selectedIds.includes(e.id)
                  const checkboxId = `entry-${e.id}`
                  const isOfficial = e.type === 'official'
                  const badgeBg = isOfficial
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-amber-100 text-amber-600'
                  return (
                    <label
                      key={e.id}
                      htmlFor={checkboxId}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(e.id)}
                        className="w-4 h-4 text-violet-500 border-slate-300 rounded focus:ring-violet-400"
                      />
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${badgeBg}`}>
                        {SCHEDULE_ENTRY_TYPE_LABELS[e.type]}
                      </span>
                      <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                        {e.title}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  )
}
