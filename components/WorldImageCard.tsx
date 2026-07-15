'use client'
import Link from 'next/link'
import type { WorldImageMetadata } from '@/lib/types'

type Props = {
  meta: WorldImageMetadata
  objectURL: string | undefined
  index: number
  total: number
  onView: () => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDelete: (meta: WorldImageMetadata) => void
}

export default function WorldImageCard({
  meta,
  objectURL,
  index,
  total,
  onView,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* サムネイル */}
      <button
        type="button"
        onClick={onView}
        className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={`${meta.title ?? meta.fileName} を表示`}
      >
        {objectURL ? (
          <img
            src={objectURL}
            alt={meta.altText ?? meta.title ?? meta.fileName}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            読み込み中...
          </div>
        )}
      </button>

      {/* 情報 */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {meta.title ?? meta.fileName}
        </p>
        {meta.caption && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{meta.caption}</p>
        )}
        {meta.category && (
          <span className="inline-block self-start text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full mt-1">
            {meta.category}
          </span>
        )}

        {/* アクションボタン */}
        <div className="flex items-center gap-1 mt-auto pt-2">
          <Link
            href={`/world/edit?id=${meta.id}`}
            className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[32px] flex items-center justify-center"
          >
            編集
          </Link>
          <button
            type="button"
            onClick={() => onDelete(meta)}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors min-h-[32px]"
          >
            削除
          </button>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => onMoveUp(meta.id)}
              disabled={index === 0}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="上へ移動"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMoveDown(meta.id)}
              disabled={index === total - 1}
              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="下へ移動"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
