'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getAllMetadata, getBlob, deleteImage, updateSortOrders } from '@/lib/worldImageDB'
import { generateId } from '@/lib/utils'
import type { WorldImageMetadata, Toast } from '@/lib/types'
import WorldImageCard from '@/components/WorldImageCard'
import WorldImageLightbox from '@/components/WorldImageLightbox'
import WorldBackupPanel from '@/components/WorldBackupPanel'
import ToastComponent from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function WorldGalleryClient() {
  const [images, setImages] = useState<WorldImageMetadata[]>([])
  const [objectURLs, setObjectURLs] = useState<Map<string, string>>(new Map())
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deleteTarget, setDeleteTarget] = useState<WorldImageMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const revokeURLsRef = useRef<Map<string, string>>(new Map())

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const loadImages = useCallback(async () => {
    setIsLoading(true)
    try {
      const metas = await getAllMetadata()
      setImages(metas)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  // Blob URL 読み込み
  useEffect(() => {
    let cancelled = false

    async function loadBlobs() {
      const newMap = new Map<string, string>()
      for (const meta of images) {
        if (revokeURLsRef.current.has(meta.id)) {
          newMap.set(meta.id, revokeURLsRef.current.get(meta.id)!)
          continue
        }
        const blob = await getBlob(meta.id)
        if (cancelled) break
        if (blob) {
          const url = URL.createObjectURL(blob)
          newMap.set(meta.id, url)
        }
      }
      if (!cancelled) {
        revokeURLsRef.current.forEach((url, id) => {
          if (!newMap.has(id)) URL.revokeObjectURL(url)
        })
        revokeURLsRef.current = newMap
        setObjectURLs(new Map(newMap))
      }
    }

    loadBlobs()

    return () => {
      cancelled = true
    }
  }, [images])

  useEffect(() => {
    return () => {
      revokeURLsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleMoveUp = useCallback(async (id: string) => {
    const idx = images.findIndex((img) => img.id === id)
    if (idx <= 0) return
    const newOrder = images.map((img) => img.id)
    ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    await updateSortOrders(newOrder)
    await loadImages()
  }, [images, loadImages])

  const handleMoveDown = useCallback(async (id: string) => {
    const idx = images.findIndex((img) => img.id === id)
    if (idx < 0 || idx >= images.length - 1) return
    const newOrder = images.map((img) => img.id)
    ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
    await updateSortOrders(newOrder)
    await loadImages()
  }, [images, loadImages])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteImage(deleteTarget.id)
      addToast('画像を削除しました', 'success')
      setDeleteTarget(null)
      setSelectedIndex(null)
      await loadImages()
    } catch {
      addToast('削除に失敗しました', 'error')
    }
  }, [deleteTarget, addToast, loadImages])

  return (
    <div className="min-h-screen">
      {/* ヒーローバナー */}
      <div className="bg-gradient-to-br from-sky-400 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-xs font-medium tracking-widest uppercase mb-1">Novel Character Sheet</p>
            <h1 className="text-3xl font-bold tracking-tight">世界観ギャラリー</h1>
            {images.length > 0 && (
              <p className="text-sky-200 text-sm mt-1">{images.length}枚</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/world/add"
              className="px-5 py-2.5 text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 rounded-full transition-colors shadow-sm"
            >
              + 追加
            </Link>
            <WorldBackupPanel onRestored={loadImages} onToast={addToast} />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">読み込み中...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🖼️</div>
            <p className="text-slate-400 mb-6 text-sm">画像がまだ登録されていません</p>
            <Link
              href="/world/add"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full transition-colors shadow-sm"
            >
              最初の画像を追加する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {images.map((meta, idx) => (
              <WorldImageCard
                key={meta.id}
                meta={meta}
                objectURL={objectURLs.get(meta.id)}
                onView={() => setSelectedIndex(idx)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ライトボックス */}
      {selectedIndex !== null && (
        <WorldImageLightbox
          images={images}
          objectURLs={objectURLs}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDelete={setDeleteTarget}
        />
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="画像を削除しますか？"
        message={`「${deleteTarget?.title ?? deleteTarget?.fileName ?? ''}」を削除します。この操作は元に戻せません。`}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        isDanger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastComponent toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
