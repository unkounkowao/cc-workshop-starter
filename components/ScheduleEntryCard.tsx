'use client'
import Link from 'next/link'
import type { ScheduleEntry, ScheduleEntryImportance } from '@/lib/types'
import type { Character } from '@/lib/types'
import { SCHEDULE_STATUS_LABELS, SCHEDULE_IMPORTANCE_LABELS } from '@/lib/constants'

type Props = {
  entry: ScheduleEntry
  characters: Character[]
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

export default function ScheduleEntryCard({ entry, characters }: Props) {
  const isOfficial = entry.type === 'official'
  const detailHref = isOfficial
    ? `/schedule/official/detail?id=${entry.id}`
    : `/schedule/plot/detail?id=${entry.id}`

  const borderColor = isOfficial ? 'border-l-blue-400' : 'border-l-amber-400'

  const dateString = buildDateString(entry)

  const relatedCharacters = entry.relatedCharacterIds
    .map((id) => characters.find((c) => c.id === id))
    .filter((c): c is Character => c !== undefined)

  const visibleChars = relatedCharacters.slice(0, 3)
  const hiddenCount = relatedCharacters.length - visibleChars.length

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 border-l-4 ${borderColor}`}
    >
      <Link
        href={detailHref}
        className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-xl group"
        aria-label={`${entry.title} の詳細を見る`}
      >
        {/* 重要度ドット + ステータス */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {entry.importance && <ImportanceDot importance={entry.importance} />}
          </div>
          {isOfficial && entry.status && (
            <span className="text-xs text-slate-400 shrink-0">
              {SCHEDULE_STATUS_LABELS[entry.status]}
            </span>
          )}
        </div>

        {/* 日付 */}
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
    </div>
  )
}
