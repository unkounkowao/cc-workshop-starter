'use client'
import { useRef, useState } from 'react'
import { getAllForBackup, clearAll, saveImage, getAllMetadata } from '@/lib/worldImageDB'
import { createBackupZip, parseBackupZip } from '@/lib/worldBackup'
import type { ToastType } from '@/lib/types'

type Props = {
  onRestored: () => void
  onToast: (msg: string, type: ToastType) => void
}

export default function WorldBackupPanel({ onRestored, onToast }: Props) {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreMode, setRestoreMode] = useState<'replace' | 'append'>('append')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const items = await getAllForBackup()
      if (items.length === 0) {
        onToast('バックアップする画像がありません', 'warning')
        return
      }
      const blob = await createBackupZip(items)
      const date = new Date().toISOString().slice(0, 10)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `world-gallery-backup-${date}.zip`
      a.click()
      URL.revokeObjectURL(url)
      onToast(`${items.length}件のバックアップを作成しました`, 'success')
    } catch (e) {
      onToast(`バックアップに失敗しました: ${e instanceof Error ? e.message : '不明なエラー'}`, 'error')
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsRestoring(true)
    try {
      const existingMetas = await getAllMetadata()
      const existingIds = new Set(existingMetas.map((m) => m.id))
      const result = await parseBackupZip(file, existingIds)

      if (result.success.length === 0 && result.failed.length > 0) {
        onToast(`復元できる画像がありませんでした（${result.failed.length}件失敗）`, 'error')
        return
      }

      if (restoreMode === 'replace') {
        await clearAll()
      }

      for (const item of result.success) {
        await saveImage(item.meta, item.blob)
      }

      const msg = result.failed.length > 0
        ? `${result.success.length}件を復元しました（${result.failed.length}件失敗）`
        : `${result.success.length}件を復元しました`

      onToast(msg, result.failed.length > 0 ? 'warning' : 'success')
      onRestored()
    } catch (e) {
      onToast(`復元に失敗しました: ${e instanceof Error ? e.message : '不明なエラー'}`, 'error')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleBackup}
        disabled={isBackingUp}
        className="px-3 py-2 text-sm text-white/90 border border-white/40 rounded-full hover:bg-white/20 transition-colors min-h-[40px] disabled:opacity-60"
      >
        {isBackingUp ? 'バックアップ中...' : 'バックアップ'}
      </button>

      <div className="flex items-center gap-1">
        <select
          value={restoreMode}
          onChange={(e) => setRestoreMode(e.target.value as 'replace' | 'append')}
          className="text-sm px-2 py-2 rounded-full border border-white/40 bg-transparent text-white/90 min-h-[40px]"
          aria-label="復元モード"
        >
          <option value="append">追加復元</option>
          <option value="replace">置換復元</option>
        </select>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="px-3 py-2 text-sm text-white/90 border border-white/40 rounded-full hover:bg-white/20 transition-colors min-h-[40px] disabled:opacity-60"
        >
          {isRestoring ? '復元中...' : '復元'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleRestoreFileSelect}
        />
      </div>
    </div>
  )
}
