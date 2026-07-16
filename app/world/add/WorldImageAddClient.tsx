'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveImage } from '@/lib/worldImageDB'
import { validateImageFile, normalizeMetadataText } from '@/lib/worldImageValidation'

type FileEntry = {
  file: File
  preview: string
  error: string | null
  title: string
  caption: string
  category: string
}

function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function WorldImageAddClient() {
  const router = useRouter()
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: File[]) => {
    const newEntries: FileEntry[] = files.map((file) => {
      const error = validateImageFile(file)
      const preview = error ? '' : URL.createObjectURL(file)
      return {
        file,
        preview,
        error,
        title: '',
        caption: '',
        category: '',
      }
    })
    setEntries((prev) => [...prev, ...newEntries])
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) addFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) addFiles(files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const updateEntry = (idx: number, field: keyof Omit<FileEntry, 'file' | 'preview' | 'error'>, value: string) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const removeEntry = (idx: number) => {
    setEntries((prev) => {
      const entry = prev[idx]
      if (entry.preview) URL.revokeObjectURL(entry.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => !e.error)
    if (validEntries.length === 0) {
      setGlobalError('登録できる画像がありません')
      return
    }

    setIsProcessing(true)
    setGlobalError(null)
    let successCount = 0
    let failCount = 0

    for (const entry of validEntries) {
      try {
        const size = await getImageSize(entry.file)
        await saveImage(
          {
            fileName: entry.file.name,
            mimeType: entry.file.type,
            fileSize: entry.file.size,
            width: size.width || undefined,
            height: size.height || undefined,
            title: normalizeMetadataText(entry.title),
            caption: normalizeMetadataText(entry.caption),
            category: normalizeMetadataText(entry.category),
          },
          entry.file
        )
        successCount++
      } catch {
        failCount++
      }
    }

    setIsProcessing(false)

    // プレビューURLを解放
    entries.forEach((e) => { if (e.preview) URL.revokeObjectURL(e.preview) })

    if (failCount > 0) {
      setGlobalError(`${successCount}件登録完了、${failCount}件失敗しました`)
    } else {
      router.push('/world')
    }
  }

  return (
    <div className="min-h-screen pb-10">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push('/world')}
            className="text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-slate-800">画像を追加</h1>
        </div>

        {/* ドロップゾーン */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6 ${
            isDragging
              ? 'border-sky-400 bg-sky-50'
              : 'border-sky-100 bg-white'
          }`}
        >
          <p className="text-slate-400 mb-3">
            ここに画像をドロップ、または
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors text-sm"
          >
            ファイルを選択
          </button>
          <p className="text-xs text-slate-400 mt-2">JPEG / PNG / WebP / GIF, 最大10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* エラー */}
        {globalError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
            {globalError}
          </div>
        )}

        {/* ファイルリスト */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-sky-100 p-4 flex flex-col gap-3"
              >
                <div className="flex gap-3 items-start">
                  {/* プレビュー */}
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-sky-50 flex items-center justify-center">
                    {entry.preview ? (
                      <img src={entry.preview} alt={entry.file.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">エラー</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.file.name}</p>
                    <p className="text-xs text-slate-400">{(entry.file.size / 1024).toFixed(1)} KB</p>
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-1">{entry.error}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="text-slate-400 hover:text-red-500 text-xl leading-none"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>

                {!entry.error && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">タイトル</label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateEntry(idx, 'title', e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg border border-sky-100 bg-white text-slate-800"
                        placeholder="画像のタイトル"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">カテゴリー</label>
                      <input
                        type="text"
                        value={entry.category}
                        onChange={(e) => updateEntry(idx, 'category', e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg border border-sky-100 bg-white text-slate-800"
                        placeholder="例: 人物, 風景, 道具"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">キャプション</label>
                      <input
                        type="text"
                        value={entry.caption}
                        onChange={(e) => updateEntry(idx, 'caption', e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg border border-sky-100 bg-white text-slate-800"
                        placeholder="画像の説明"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* フッターボタン */}
        {entries.length > 0 && (
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.push('/world')}
              className="px-4 py-2 text-sm rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-6 py-2 text-sm font-medium rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors min-h-[44px] disabled:opacity-60"
            >
              {isProcessing ? '登録中...' : `${entries.filter((e) => !e.error).length}件を登録`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
