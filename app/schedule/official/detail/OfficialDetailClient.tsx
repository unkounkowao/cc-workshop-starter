'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmDialog from '@/components/ConfirmDialog'
import Toast from '@/components/Toast'
import { loadEntry, loadYear, loadEntries, deleteEntry, sortEntriesInMonth } from '@/lib/scheduleStorage'
import { loadCharacters } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_IMPORTANCE_LABELS,
} from '@/lib/constants'
import type { ScheduleEntry, StoryYear, Character, Toast as ToastType } from '@/lib/types'

function buildDateString(entry: ScheduleEntry): string {
  const parts: string[] = []
  if (entry.dateLabel) parts.push(entry.dateLabel)
  if (entry.startDay !== undefined && entry.endDay !== undefined) {
    if (entry.startDay === entry.endDay) {
      parts.push(`${entry.startDay}日`)
    } else {
      parts.push(`${entry.startDay}〜${entry.endDay}日`)
    }
  } else if (entry.startDay !== undefined) {
    parts.push(`${entry.startDay}日`)
  }
  if (entry.timeLabel) parts.push(entry.timeLabel)
  return parts.join(' ')
}

function DetailField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  const paragraphs = value.split(/\n\n+/)
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-slate-800 space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">{p}</p>
        ))}
      </dd>
    </div>
  )
}

export default function OfficialDetailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const entryId = searchParams.get('id') ?? ''

  const [entry, setEntry] = useState<ScheduleEntry | null>(null)
  const [year, setYear] = useState<StoryYear | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [yearEntries, setYearEntries] = useState<ScheduleEntry[]>([])
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    setMounted(true)
    if (!entryId) { setNotFound(true); return }
    const e = loadEntry(entryId)
    if (!e || e.type !== 'official') { setNotFound(true); return }
    setEntry(e)
    const y = loadYear(e.yearId)
    setYear(y)
    setCharacters(loadCharacters())
    setYearEntries(loadEntries(e.yearId).filter((en) => en.type === 'official'))
  }, [entryId])

  if (!mounted) return null

  if (notFound || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-slate-500 text-lg">エントリが見つかりません</p>
          <Link href="/schedule" className="text-sky-600 hover:underline text-sm">
            年間スケジュールへ戻る
          </Link>
        </div>
      </div>
    )
  }

  const monthObj = year?.months.find((m) => m.id === entry.monthId)
  const dateStr = buildDateString(entry)

  const sameTypeEntries = year
    ? year.months.flatMap((m) =>
        sortEntriesInMonth(yearEntries.filter((e) => e.monthId === m.id))
      )
    : yearEntries
  const currentIndex = sameTypeEntries.findIndex((e) => e.id === entry.id)
  const prevEntry = currentIndex > 0 ? sameTypeEntries[currentIndex - 1] : null
  const nextEntry = currentIndex < sameTypeEntries.length - 1 ? sameTypeEntries[currentIndex + 1] : null

  const relatedCharacters = entry.relatedCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is Character => c !== undefined)

  const relatedEntries = entry.relatedEntryIds
    .map((id) => {
      const found = yearEntries.find((e) => e.id === id)
      return found ?? loadEntry(id)
    })
    .filter((e): e is ScheduleEntry => e !== null)

  const handleDelete = () => {
    deleteEntry(entry.id)
    setToasts([{ id: generateId(), message: 'エントリを削除しました', type: 'success' }])
    setTimeout(() => router.push('/schedule'), 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ブレッドクラム */}
        <nav aria-label="パンくずリスト">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 hover:underline transition-colors"
          >
            ← カレンダーへ戻る
          </Link>
        </nav>

        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.importance && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  entry.importance === 'high'
                    ? 'bg-red-100 text-red-700'
                    : entry.importance === 'medium'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  重要度: {SCHEDULE_IMPORTANCE_LABELS[entry.importance]}
                </span>
              )}
              {entry.status && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {SCHEDULE_STATUS_LABELS[entry.status]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/schedule/official/edit?id=${entry.id}`}
                className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                編集
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                削除
              </button>
            </div>
          </div>

          {(monthObj || dateStr) && (
            <p className="text-sm text-slate-500">
              {monthObj && <span className="text-slate-600">{monthObj.name}</span>}
              {dateStr && <span className="ml-2">{dateStr}</span>}
            </p>
          )}

          <h1 className="text-2xl font-bold text-slate-900">{entry.title}</h1>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {entry.summary && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <dl><DetailField label="イベント概要" value={entry.summary} /></dl>
              </div>
            )}
            {entry.details && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <dl><DetailField label="出来事" value={entry.details} /></dl>
              </div>
            )}
            {relatedCharacters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">関連キャラクター</h2>
                <div className="flex flex-wrap gap-2">
                  {relatedCharacters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/character?id=${c.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 text-sm rounded-full transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {relatedEntries.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">関連エントリ</h2>
                <div className="space-y-2">
                  {relatedEntries.map((re) => {
                    const href = re.type === 'official'
                      ? `/schedule/official/detail?id=${re.id}`
                      : `/schedule/plot/detail?id=${re.id}`
                    return (
                      <Link
                        key={re.id}
                        href={href}
                        className="block px-3 py-2 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-100 text-sm text-slate-700 hover:text-sky-700 transition-colors"
                      >
                        {re.title}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <dl className="space-y-4">
                {entry.category && <DetailField label="カテゴリ" value={entry.category} />}
                {entry.location && <DetailField label="場所" value={entry.location} />}
                {entry.status && (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ステータス</dt>
                    <dd className="text-sm text-slate-800">{SCHEDULE_STATUS_LABELS[entry.status]}</dd>
                  </div>
                )}
                {entry.importance && (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">重要度</dt>
                    <dd className="text-sm text-slate-800">{SCHEDULE_IMPORTANCE_LABELS[entry.importance]}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Prev / Next */}
        <nav className="flex items-center justify-between gap-4 pt-2" aria-label="前後のエントリへの移動">
          {prevEntry ? (
            <Link
              href={`/schedule/official/detail?id=${prevEntry.id}`}
              className="flex-1 flex flex-col items-start gap-0.5 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-[#217dff]/40 hover:shadow-md transition-all group max-w-xs"
            >
              <span className="text-xs text-slate-400 group-hover:text-[#217dff] transition-colors">← 前へ</span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#217dff] transition-colors line-clamp-1">{prevEntry.title}</span>
            </Link>
          ) : <div className="flex-1 max-w-xs" />}
          {nextEntry ? (
            <Link
              href={`/schedule/official/detail?id=${nextEntry.id}`}
              className="flex-1 flex flex-col items-end gap-0.5 px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-[#217dff]/40 hover:shadow-md transition-all group max-w-xs"
            >
              <span className="text-xs text-slate-400 group-hover:text-[#217dff] transition-colors">次へ →</span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-[#217dff] transition-colors line-clamp-1">{nextEntry.title}</span>
            </Link>
          ) : <div className="flex-1 max-w-xs" />}
        </nav>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="エントリを削除しますか？"
        message={`「${entry.title}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger
      />

      <Toast toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  )
}
