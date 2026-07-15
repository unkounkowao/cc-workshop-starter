'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getAllMetadata, getBlob, deleteImage, updateSortOrders } from '@/lib/worldImageDB'
import { filterAndSearch, getUniqueCategories } from '@/lib/worldImageValidation'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
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
        // 不要になったURLを解放
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

  // アンマウント時にURLを解放
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
      await loadImages()
    } catch {
      addToast('削除に失敗しました', 'error')
    }
  }, [deleteTarget, addToast, loadImages])

  const filtered = filterAndSearch(images, searchQuery, categoryFilter)
  const categories = getUniqueCategories(images)

  // フィルター済みインデックスを元の images のインデックスに変換
  const getOriginalIndex = (filteredIdx: number) => {
    const meta = filtered[filteredIdx]
    return images.findIndex((img) => img.id === meta.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">世界観ギャラリー</h1>
            <div className="flex flex-wrap gap-2 items-center flex-1 justify-end">
              {/* 検索 */}
              <input
                type="search"
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[40px] w-40"
              />
              {/* カテゴリーフィルター */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-sm px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 min-h-[40px]"
                >
                  <option value="">すべてのカテゴリー</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              {/* 追加ボタン */}
              <Link
                href="/world/add"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[40px] flex items-center"
              >
                + 追加
              </Link>
              {/* バックアップ */}
              <WorldBackupPanel
                onRestored={loadImages}
                onToast={addToast}
              />
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 mb-4">画像がまだ登録されていません</p>
            <Link
              href="/world/add"
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              最初の画像を追加する
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            検索条件に一致する画像がありません
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((meta, filteredIdx) => (
              <WorldImageCard
                key={meta.id}
                meta={meta}
                objectURL={objectURLs.get(meta.id)}
                index={getOriginalIndex(filteredIdx)}
                total={images.length}
                onView={() => setSelectedIndex(filteredIdx)}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      {/* ライトボックス */}
      {selectedIndex !== null && (
        <WorldImageLightbox
          images={filtered}
          objectURLs={objectURLs}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
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

      {/* Toast */}
      <ToastComponent toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
