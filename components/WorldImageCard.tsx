'use client'
import type { WorldImageMetadata } from '@/lib/types'

type Props = {
  meta: WorldImageMetadata
  objectURL: string | undefined
  onView: () => void
}

export default function WorldImageCard({ meta, objectURL, onView }: Props) {
  return (
    <button
      type="button"
      onClick={onView}
      className="relative w-full aspect-square overflow-hidden rounded-xl bg-sky-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400"
      aria-label={`${meta.title ?? meta.fileName} を表示`}
    >
      {objectURL ? (
        <img
          src={objectURL}
          alt={meta.title ?? meta.fileName}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          読み込み中...
        </div>
      )}
    </button>
  )
}
