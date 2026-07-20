'use client'
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'
import ScheduleEntryCard from '@/components/ScheduleEntryCard'
import ScheduleGistSync from '@/components/ScheduleGistSync'
import {
  loadYears,
  saveYear,
  deleteYear,
  getNextYearSortOrder,
  loadEntries,
  deleteEntry,
  sortEntriesInMonth,
  countEntriesForYear,
} from '@/lib/scheduleStorage'
import { exportScheduleBackup, importScheduleBackup } from '@/lib/scheduleBackup'
import {
  SCHEDULE_SELECTED_YEAR_KEY,
  DEFAULT_MONTH_NAMES,
} from '@/lib/constants'
import { generateId, now } from '@/lib/utils'
import type { StoryYear, ScheduleEntry, ScheduleData, Toast as ToastType, ScheduleImportMode } from '@/lib/types'

// ===== 年フォームモーダル =====

type YearFormErrors = {
  name?: string
  months?: string[]
}

function YearFormModal({
  year,
  onSave,
  onClose,
}: {
  year: StoryYear | null
  onSave: (year: StoryYear) => void
  onClose: () => void
}) {
  const [name, setName] = useState(year?.name ?? '')
  const [monthNames, setMonthNames] = useState<string[]>(
    year ? year.months.map((m) => m.name) : [...DEFAULT_MONTH_NAMES]
  )
  const [errors, setErrors] = useState<YearFormErrors>({})

  const handleMonthChange = (index: number, value: string) => {
    setMonthNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: YearFormErrors = {}
    if (!name.trim()) newErrors.name = '年の名前を入力してください'

    const monthErrors: string[] = []
    monthNames.forEach((mn, i) => {
      if (!mn.trim()) monthErrors[i] = `${i + 1}番目の月名を入力してください`
    })
    if (monthErrors.some(Boolean)) newErrors.months = monthErrors

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const months = year
      ? year.months.map((m, i) => ({ ...m, name: monthNames[i] ?? m.name }))
      : monthNames.map((mn, i) => ({
          id: generateId(),
          name: mn,
          monthNumber: i + 1,
        }))

    const savedYear: StoryYear = {
      id: year?.id ?? generateId(),
      name: name.trim(),
      description: undefined,
      months,
      sortOrder: year?.sortOrder ?? getNextYearSortOrder(),
      createdAt: year?.createdAt ?? now(),
      updatedAt: now(),
    }
    onSave(savedYear)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="year-modal-title"
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <h2 id="year-modal-title" className="text-lg font-bold text-slate-800">
            {year ? '年を編集' : '新しい年を追加'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="year-name" className="block text-sm font-medium text-slate-700 mb-1">
              年の名前 <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="year-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="例: 第1章 / 2024年 / 序章"
              aria-describedby={errors.name ? 'year-name-error' : undefined}
            />
            {errors.name && (
              <p id="year-name-error" className="text-xs text-red-500 mt-1" role="alert">{errors.name}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">月の名前</p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {monthNames.map((mn, i) => (
                <div key={i}>
                  <label htmlFor={`month-${i}`} className="text-xs text-slate-500 mb-0.5 block">
                    {i + 1}番目の月
                  </label>
                  <input
                    id={`month-${i}`}
                    type="text"
                    value={mn}
                    onChange={(e) => handleMonthChange(i, e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                    aria-describedby={errors.months?.[i] ? `month-error-${i}` : undefined}
                  />
                  {errors.months?.[i] && (
                    <p id={`month-error-${i}`} className="text-xs text-red-500 mt-0.5" role="alert">
                      {errors.months[i]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors min-h-[44px]"
            >
              {year ? '更新する' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ===== バックアップパネル =====

function BackupPanel({
  onSuccess,
  onError,
}: {
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<ScheduleImportMode>('append')
  const [pendingData, setPendingData] = useState<unknown>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleExport = () => {
    try {
      exportScheduleBackup()
      onSuccess('バックアップをダウンロードしました')
    } catch {
      onError('バックアップの出力に失敗しました')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        setPendingData(parsed)
        setShowConfirm(true)
      } catch {
        onError('JSONの読み込みに失敗しました')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportConfirm = () => {
    if (!pendingData) return
    const result = importScheduleBackup(pendingData, importMode)
    setShowConfirm(false)
    setPendingData(null)
    if (result.success) {
      onSuccess(
        `復元完了: 年 ${result.yearsImported}件、エントリ ${result.entriesImported}件をインポートしました`
      )
    } else {
      onError(result.errors[0] ?? '復元に失敗しました')
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          バックアップ
        </button>
        <div className="flex items-center gap-1">
          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value as ScheduleImportMode)}
            className="text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
            aria-label="インポートモード"
          >
            <option value="append">追加</option>
            <option value="replace">置き換え</option>
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            復元
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="バックアップファイルを選択"
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="スケジュールを復元しますか？"
        message={
          importMode === 'replace'
            ? '現在のスケジュールデータをすべて置き換えます。この操作は取り消せません。'
            : '既存のデータに追加します。重複するIDは新しいIDで保存されます。'
        }
        confirmLabel="復元する"
        onConfirm={handleImportConfirm}
        onCancel={() => { setShowConfirm(false); setPendingData(null) }}
        isDanger={importMode === 'replace'}
      />
    </>
  )
}

// ===== メインコンポーネント =====

function addToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastType[]>>,
  message: string,
  type: ToastType['type']
) {
  const id = generateId()
  setToasts((prev) => [...prev, { id, message, type }])
}

export default function ScheduleClient() {
  const [mounted, setMounted] = useState(false)
  const [years, setYears] = useState<StoryYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [showYearModal, setShowYearModal] = useState(false)
  const [editingYear, setEditingYear] = useState<StoryYear | null>(null)
  const [deleteYearTarget, setDeleteYearTarget] = useState<StoryYear | null>(null)
  const [toasts, setToasts] = useState<ToastType[]>([])

  const scheduleData: ScheduleData = useMemo(
    () => ({ version: 1, years, entries: loadEntries() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [years, entries]
  )

  const reloadAll = useCallback(() => {
    const updatedYears = loadYears()
    setYears(updatedYears)
    if (selectedYearId) setEntries(loadEntries(selectedYearId))
  }, [selectedYearId])

  const showSuccess = useCallback((msg: string) => addToast(setToasts, msg, 'success'), [])
  const showError = useCallback((msg: string) => addToast(setToasts, msg, 'error'), [])

  // マウント時にデータ読み込み
  useEffect(() => {
    setMounted(true)
    const loadedYears = loadYears()
    setYears(loadedYears)

    const storedYearId = localStorage.getItem(SCHEDULE_SELECTED_YEAR_KEY)
    if (storedYearId && loadedYears.some((y) => y.id === storedYearId)) {
      setSelectedYearId(storedYearId)
    } else if (loadedYears.length > 0) {
      setSelectedYearId(loadedYears[0].id)
    }
  }, [])

  // selectedYearId 変更時にエントリを読み込み
  useEffect(() => {
    if (!mounted) return
    if (selectedYearId) {
      localStorage.setItem(SCHEDULE_SELECTED_YEAR_KEY, selectedYearId)
      setEntries(loadEntries(selectedYearId))
    } else {
      setEntries([])
    }
  }, [selectedYearId, mounted])

  const selectedYear = useMemo(
    () => years.find((y) => y.id === selectedYearId) ?? null,
    [years, selectedYearId]
  )

  // 表示用エントリ（全件）
  const filteredEntries = useMemo(() => {
    if (!selectedYear) return []
    return entries
  }, [entries, selectedYear])

  // 月別グループ
  const entriesByMonth = useMemo(() => {
    if (!selectedYear) return {}
    const map: Record<string, ScheduleEntry[]> = {}
    selectedYear.months.forEach((m) => { map[m.id] = [] })
    filteredEntries.forEach((e) => {
      if (map[e.monthId] !== undefined) map[e.monthId].push(e)
    })
    return map
  }, [selectedYear, filteredEntries])

  // 年の選択変更
  const handleYearChange = (id: string) => {
    setSelectedYearId(id)
  }

  // 年の保存（作成・編集）
  const handleYearSave = (year: StoryYear) => {
    saveYear(year)
    const updated = loadYears()
    setYears(updated)
    if (!selectedYearId || selectedYearId === year.id) {
      setSelectedYearId(year.id)
    }
    setShowYearModal(false)
    setEditingYear(null)
    showSuccess(editingYear ? '年を更新しました' : '年を追加しました')
  }

  // 年の削除実行
  const handleYearDeleteConfirm = () => {
    if (!deleteYearTarget) return
    deleteYear(deleteYearTarget.id)
    const updated = loadYears()
    setYears(updated)
    if (selectedYearId === deleteYearTarget.id) {
      setSelectedYearId(updated.length > 0 ? updated[0].id : null)
    }
    setDeleteYearTarget(null)
    showSuccess('年を削除しました')
  }

  if (!mounted) return null

  // ===== 空状態（年なし） =====
  if (years.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="text-5xl" aria-hidden="true">📅</div>
            <h1 className="text-2xl font-bold text-slate-800">カレンダー</h1>
            <p className="text-slate-500 text-sm">最初の年を追加してスケジュールを作成しましょう</p>
            <button
              type="button"
              onClick={() => { setEditingYear(null); setShowYearModal(true) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors"
            >
              + 年を追加する
            </button>
          </div>
        </div>
        {showYearModal && (
          <YearFormModal
            year={editingYear}
            onSave={handleYearSave}
            onClose={() => { setShowYearModal(false); setEditingYear(null) }}
          />
        )}
        <Toast toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      {/* ===== ツールバー ===== */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {/* 年セレクタ */}
            <select
              value={selectedYearId ?? ''}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-24 shrink-0 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
              aria-label="表示する年を選択"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => { setEditingYear(null); setShowYearModal(true) }}
              className="shrink-0 px-2 py-1.5 text-xs text-sky-600 border border-sky-300 rounded-lg hover:bg-sky-50 transition-colors whitespace-nowrap"
            >
              +追加
            </button>
            {selectedYear && (
              <>
                <button
                  type="button"
                  onClick={() => { setEditingYear(selectedYear); setShowYearModal(true) }}
                  className="shrink-0 px-2 py-1.5 text-xs text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteYearTarget(selectedYear)}
                  className="shrink-0 px-2 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              </>
            )}

            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <ScheduleGistSync
                data={scheduleData}
                onSynced={reloadAll}
                onToast={(msg, type) => addToast(setToasts, msg, type)}
              />
              <BackupPanel
                onSuccess={(msg) => { showSuccess(msg); reloadAll() }}
                onError={showError}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== コンテンツエリア ===== */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedYear ? (
          <div className="text-center py-16">
            <p className="text-slate-500">年を選択してください</p>
          </div>
        ) : entries.length === 0 ? (
          /* 年は選択済みだがエントリなし */
          <div className="text-center py-16 space-y-4">
            <div className="text-4xl" aria-hidden="true">📝</div>
            <p className="text-slate-500">このシナリオにはまだ予定がありません</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href={`/schedule/official/new?yearId=${selectedYear.id}`}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                + 公式スケジュールを追加
              </Link>
              <Link
                href={`/schedule/plot/new?yearId=${selectedYear.id}`}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
              >
                + 出来事を追加
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedYear.months.map((month) => {
              const monthEntries = sortEntriesInMonth(entriesByMonth[month.id] ?? [])
              return (
                <section key={month.id} aria-labelledby={`month-${month.id}`}>
                  <details open className="group">
                    <summary
                      id={`month-${month.id}`}
                      className="flex items-center justify-between gap-2 cursor-pointer list-none select-none mb-3"
                    >
                      <div className="flex items-center gap-3">
                        <h2 className="text-base font-bold text-slate-700">
                          {month.name}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/schedule/official/new?yearId=${selectedYear.id}&monthId=${month.id}`}
                          className="px-2.5 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          + 公式
                        </Link>
                        <Link
                          href={`/schedule/plot/new?yearId=${selectedYear.id}&monthId=${month.id}`}
                          className="px-2.5 py-1 text-xs text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          + 出来事
                        </Link>
                        <span className="text-slate-300 text-sm group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
                      </div>
                    </summary>

                    {monthEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 pl-2 py-2">
                        この月にエントリはありません
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {monthEntries.map((entry) => (
                          <ScheduleEntryCard
                            key={entry.id}
                            entry={entry}
                          />
                        ))}
                      </div>
                    )}
                  </details>
                  <hr className="border-slate-200 mt-4" />
                </section>
              )
            })}
          </div>
        )}
      </main>

      {/* ===== モーダル・ダイアログ ===== */}
      {showYearModal && (
        <YearFormModal
          year={editingYear}
          onSave={handleYearSave}
          onClose={() => { setShowYearModal(false); setEditingYear(null) }}
        />
      )}

      <ConfirmDialog
        isOpen={deleteYearTarget !== null}
        title="年を削除しますか？"
        message={
          deleteYearTarget
            ? `「${deleteYearTarget.name}」を削除します。この年に属するエントリ ${countEntriesForYear(deleteYearTarget.id)} 件もすべて削除されます。この操作は取り消せません。`
            : ''
        }
        confirmLabel="削除する"
        onConfirm={handleYearDeleteConfirm}
        onCancel={() => setDeleteYearTarget(null)}
        isDanger
      />

      <Toast
        toasts={toasts}
        onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  )
}
