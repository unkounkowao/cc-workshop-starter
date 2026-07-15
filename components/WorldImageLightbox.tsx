'use client'
import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import type { WorldImageMetadata } from '@/lib/types'

type Props = {
  images: WorldImageMetadata[]
  objectURLs: Map<string, string>
  initialIndex: number
  onClose: () => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDelete: (meta: WorldImageMetadata) => void
}

export default function WorldImageLightbox({
  images,
  objectURLs,
  initialIndex,
  onClose,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const current = images[currentIndex]

  // 並び替え後に同じ画像を追跡する
  const currentId = current?.id
  useEffect(() => {
    if (!currentId) return
    const newIdx = images.findIndex((img) => img.id === currentId)
    if (newIdx >= 0 && newIdx !== currentIndex) {
      setCurrentIndex(newIdx)
    }
  }, [images, currentId, currentIndex])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : i))
  }, [images.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goPrev, goNext])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!current) return null

  const objectURL = objectURLs.get(current.id)

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={current.title ?? current.fileName}
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full flex flex-col md:flex-row gap-4 bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none"
          aria-label="閉じる"
        >
          ×
        </button>

        {/* 画像エリア */}
        <div className="flex-1 flex items-center justify-center bg-black min-h-[200px] relative">
          {objectURL ? (
            <img
              src={objectURL}
              alt={current.altText ?? current.title ?? current.fileName}
              className="max-h-[80vh] max-w-full object-contain"
            />
          ) : (
            <div className="text-gray-400 text-sm p-8">画像を読み込めませんでした</div>
          )}

          {/* 前後ボタン */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-xl"
              aria-label="前の画像"
            >
              ‹
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center text-xl"
              aria-label="次の画像"
            >
              ›
            </button>
          )}
        </div>

        {/* 情報・操作エリア */}
        <div className="md:w-64 p-4 flex flex-col gap-3 text-white shrink-0">
          {current.title && (
            <h2 className="text-lg font-semibold">{current.title}</h2>
          )}
          {current.caption && (
            <p className="text-sm text-gray-300 leading-relaxed">{current.caption}</p>
          )}
          {current.category && (
            <span className="inline-block self-start text-xs bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full">
              {current.category}
            </span>
          )}
          {current.sourceNote && (
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              出典: {current.sourceNote}
            </p>
          )}

          <p className="text-xs text-gray-500">
            {currentIndex + 1} / {images.length}
          </p>

          {/* 操作ボタン */}
          <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-gray-700">
            <div className="flex gap-2">
              <Link
                href={`/world/edit?id=${current.id}`}
                onClick={onClose}
                className="flex-1 text-center text-sm py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                編集
              </Link>
              <button
                type="button"
                onClick={() => onDelete(current)}
                className="flex-1 text-sm py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                削除
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onMoveUp(current.id)}
                disabled={currentIndex === 0}
                className="flex-1 text-sm py-1.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="上へ移動"
              >
                ↑ 上へ
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(current.id)}
                disabled={currentIndex === images.length - 1}
                className="flex-1 text-sm py-1.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="下へ移動"
              >
                ↓ 下へ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
