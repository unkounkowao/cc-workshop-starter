'use client'
import { useRef, useState } from 'react'
import { validateImportData } from '@/lib/validation'
import { downloadJson } from '@/lib/utils'
import type { CharacterSheetData, ImportMode } from '@/lib/types'

type Props = {
  data: CharacterSheetData
  onImport: (data: CharacterSheetData, mode: ImportMode) => void
  onToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

export default function ImportExport({ data, onImport, onToast }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingData, setPendingData] = useState<CharacterSheetData | null>(null)
  const [showModeSelect, setShowModeSelect] = useState(false)

  const handleExport = () => {
    const filename = `character-sheet-${new Date().toISOString().slice(0, 10)}.json`
    downloadJson(data, filename)
    onToast('データをエクスポートしました', 'success')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!validateImportData(parsed)) {
          onToast('無効なデータ形式です。キャラクターシートのJSONファイルを選択してください', 'error')
          return
        }
        setPendingData(parsed)
        setShowModeSelect(true)
      } catch {
        onToast('JSONファイルの読み込みに失敗しました', 'error')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleImport = (mode: ImportMode) => {
    if (!pendingData) return
    onImport(pendingData, mode)
    setPendingData(null)
    setShowModeSelect(false)
    onToast(
      mode === 'replace'
        ? `${pendingData.characters.length}件のキャラクターをインポートしました（置き換え）`
        : `${pendingData.characters.length}件のキャラクターを追加インポートしました`,
      'success'
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        title="データをJSONでエクスポート"
      >
        書き出し
      </button>
      <label className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer min-h-[44px] flex items-center">
        読み込み
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="JSONファイルを読み込む"
        />
      </label>

      {/* インポートモード選択 */}
      {showModeSelect && pendingData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              インポート方法を選択
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {pendingData.characters.length}件のキャラクターが含まれています
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => handleImport('append')}
                className="px-4 py-3 text-sm text-left border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <div className="font-medium text-indigo-700 dark:text-indigo-300">追加インポート</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  現在のデータを残したまま追加します
                </div>
              </button>
              <button
                onClick={() => handleImport('replace')}
                className="px-4 py-3 text-sm text-left border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <div className="font-medium text-red-700 dark:text-red-300">置き換えインポート</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  現在のデータをすべて削除して置き換えます
                </div>
              </button>
            </div>
            <button
              onClick={() => {
                setPendingData(null)
                setShowModeSelect(false)
              }}
              className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
