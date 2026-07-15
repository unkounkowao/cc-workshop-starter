'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getMetadata, getBlob, updateMetadata } from '@/lib/worldImageDB'
import { normalizeMetadataText } from '@/lib/worldImageValidation'
import type { WorldImageMetadata } from '@/lib/types'

export default function WorldImageEditClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''

  const [meta, setMeta] = useState<WorldImageMetadata | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // フォーム状態
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!id) {
      setError('IDが指定されていません')
      setIsLoading(false)
      return
    }

    let revoke: string | null = null

    async function load() {
      const m = await getMetadata(id)
      if (!m) {
        setError('画像が見つかりません')
        setIsLoading(false)
        return
      }
      setMeta(m)
      setTitle(m.title ?? '')
      setCaption(m.caption ?? '')
      setCategory(m.category ?? '')

      const blob = await getBlob(id)
      if (blob) {
        const url = URL.createObjectURL(blob)
        revoke = url
        setPreviewURL(url)
      }
      setIsLoading(false)
    }

    load()

    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [id])

  // 未保存変更警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleChange = useCallback(<T extends string>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    setIsDirty(true)
  }, [])

  const handleSave = async () => {
    if (!meta) return
    setIsSaving(true)
    try {
      await updateMetadata({
        ...meta,
        title: normalizeMetadataText(title),
        caption: normalizeMetadataText(caption),
        category: normalizeMetadataText(category),
      })
      setIsDirty(false)
      router.push('/world')
    } catch {
      setError('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error ?? '不明なエラー'}</p>
        <button
          type="button"
          onClick={() => router.push('/world')}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          ギャラリーに戻る
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/world')}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">画像を編集</h1>
          {isDirty && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">未保存の変更あり</span>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
          {/* プレビュー */}
          {previewURL && (
            <div className="flex justify-center">
              <img
                src={previewURL}
                alt={meta.title ?? meta.fileName}
                className="max-h-60 max-w-full object-contain rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                タイトル
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleChange(setTitle)(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="画像のタイトル"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                カテゴリー
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => handleChange(setCategory)(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="例: 人物, 風景, 道具"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                キャプション
              </label>
              <textarea
                value={caption}
                onChange={(e) => handleChange(setCaption)(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="画像の説明"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push('/world')}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[44px] disabled:opacity-60"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
