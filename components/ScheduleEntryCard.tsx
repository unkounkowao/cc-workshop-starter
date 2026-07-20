'use client'
import Link from 'next/link'
import type { ScheduleEntry, ScheduleEntryImportance } from '@/lib/types'
import type { Character } from '@/lib/types'
import { SCHEDULE_ENTRY_TYPE_LABELS, SCHEDULE_STATUS_LABELS, SCHEDULE_IMPORTANCE_LABELS } from '@/lib/constants'

type Props = {
  entry: ScheduleEntry
  characters: Character[]
  index: number
  total: number
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

function ImportanceDot({ importance }: { importance: ScheduleEntryImportance }) {
  const colorMap: Record<ScheduleEntryImportance, string> = {
    high: 'bg-red-400',
    medium: 'bg-orange-400',
    low: 'bg-slate-300',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colorMap[importance]}`}
      aria-label={`重要度: ${SCHEDULE_IMPORTANCE_LABELS[importance]}`}
    />
  )
}

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

export default function ScheduleEntryCard({
  entry,
  characters,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: Props) {
  const isOfficial = entry.type === 'official'
  const detailHref = isOfficial
    ? `/schedule/official/detail?id=${entry.id}`
    : `/schedule/plot/detail?id=${entry.id}`

  const borderColor = isOfficial ? 'border-l-blue-400' : 'border-l-amber-400'
  const badgeBg = isOfficial ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
  const typeIcon = isOfficial ? '📅' : '✏️'

  const dateString = buildDateString(entry)

  const relatedCharacters = entry.relatedCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is Character => c !== undefined)

  const visibleChars = relatedCharacters.slice(0, 3)
  const hiddenCount = relatedCharacters.length - visibleChars.length

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 border-l-4 ${borderColor} flex flex-col`}
    >
      {/* メインリンクエリア */}
      <Link
        href={detailHref}
        className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-t-xl flex-1 group"
        aria-label={`${entry.title} の詳細を見る`}
      >
        {/* ヘッダー行 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {/* 種別バッジ */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeBg}`}>
              <span aria-hidden="true">{typeIcon}</span>
              {SCHEDULE_ENTRY_TYPE_LABELS[entry.type]}
            </span>
            {/* 重要度ドット */}
            {entry.importance && (
              <ImportanceDot importance={entry.importance} />
            )}
          </div>
          {/* ステータス（official のみ） */}
          {isOfficial && entry.status && (
            <span className="text-xs text-slate-400 shrink-0">
              {SCHEDULE_STATUS_LABELS[entry.status]}
            </span>
          )}
        </div>

        {/* 日付・時間 */}
        {dateString && (
          <p className="text-xs text-slate-500 mb-1">{dateString}</p>
        )}

        {/* タイトル */}
        <h3 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors text-sm leading-snug mb-1 line-clamp-2">
          {entry.title}
        </h3>

        {/* 概要 */}
        {entry.summary && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
            {entry.summary}
          </p>
        )}

        {/* メタ情報行 */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {entry.category && (
            <span className="text-xs text-slate-400">
              <span aria-hidden="true">🏷 </span>{entry.category}
            </span>
          )}
          {entry.location && (
            <span className="text-xs text-slate-400">
              <span aria-hidden="true">📍 </span>{entry.location}
            </span>
          )}
          {entry.importance && (
            <span className="text-xs text-slate-400">
              重要度: {SCHEDULE_IMPORTANCE_LABELS[entry.importance]}
            </span>
          )}
          {/* plotRole（plot のみ） */}
          {!isOfficial && entry.plotRole && (
            <span className="text-xs text-amber-600">
              {entry.plotRole}
            </span>
          )}
        </div>

        {/* 関連キャラクター */}
        {visibleChars.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2" aria-label="関連キャラクター">
            {visibleChars.map((c) => (
              <span
                key={c.id}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
              >
                {c.name}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-xs text-slate-400 px-1">
                +{hiddenCount}人
              </span>
            )}
          </div>
        )}
      </Link>

      {/* アクションフッター */}
      <div className="flex border-t border-slate-100 bg-slate-50/60 rounded-b-xl">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveUp(entry.id) }}
          disabled={index === 0}
          className="flex-1 py-2 text-xs text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 rounded-bl-xl"
          aria-label={`${entry.title} を上に移動`}
        >
          ↑ 上へ
        </button>
        <div className="w-px bg-slate-100" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveDown(entry.id) }}
          disabled={index === total - 1}
          className="flex-1 py-2 text-xs text-slate-400 hover:text-sky-600 hover:bg-sky-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 rounded-br-xl"
          aria-label={`${entry.title} を下に移動`}
        >
          ↓ 下へ
        </button>
      </div>
    </div>
  )
}
