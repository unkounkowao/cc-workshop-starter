'use client'
import Link from 'next/link'
import type { ScheduleEntry } from '@/lib/types'

type Props = {
  entry: ScheduleEntry
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

export default function ScheduleEntryCard({ entry }: Props) {
  const isOfficial = entry.type === 'official'
  const detailHref = isOfficial
    ? `/schedule/official/detail?id=${entry.id}`
    : `/schedule/plot/detail?id=${entry.id}`

  const borderColor = isOfficial ? 'border-l-[#217dff]' : 'border-l-[#21ecff]'

  const dateString = buildDateString(entry)

  return (
    <div
      className={`bg-white rounded-lg border border-slate-100 border-l-4 ${borderColor} hover:shadow-sm transition-shadow`}
    >
      <Link
        href={detailHref}
        className="flex items-center gap-2 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg group"
        aria-label={`${entry.title} の詳細を見る`}
      >
        {dateString && (
          <span className="text-xs text-slate-400 shrink-0">{dateString}</span>
        )}
        <span className="text-sm text-slate-800 group-hover:text-sky-600 transition-colors truncate font-medium">
          {entry.title}
        </span>
      </Link>
    </div>
  )
}
