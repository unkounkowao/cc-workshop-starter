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
      className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`${meta.title ?? meta.fileName} を表示`}
    >
      {objectURL ? (
        <img
          src={objectURL}
          alt={meta.altText ?? meta.title ?? meta.fileName}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
          読み込み中...
        </div>
      )}
    </button>
  )
}
