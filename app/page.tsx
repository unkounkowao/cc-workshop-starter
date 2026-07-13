'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { loadCharacters, deleteCharacter, updateSortOrders, loadData, saveData } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { DATA_VERSION } from '@/lib/constants'
import type { Character, CharacterSheetData, ImportMode, Toast as ToastType } from '@/lib/types'
import CharacterCard from '@/components/CharacterCard'
import ImportExport from '@/components/ImportExport'
import GistSync from '@/components/GistSync'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCharacters(loadCharacters())
  }, [])

  const addToast = useCallback((message: string, type: ToastType['type'] = 'success') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters
    const q = searchQuery.trim().toLowerCase()
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, searchQuery])

  const isSearching = searchQuery.trim() !== ''

  const handleMoveUp = useCallback(
    (id: string) => {
      const idx = characters.findIndex((c) => c.id === id)
      if (idx <= 0) return
      const newOrder = characters.map((c) => c.id)
      ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
      updateSortOrders(newOrder)
      setCharacters(loadCharacters())
    },
    [characters]
  )

  const handleMoveDown = useCallback(
    (id: string) => {
      const idx = characters.findIndex((c) => c.id === id)
      if (idx < 0 || idx >= characters.length - 1) return
      const newOrder = characters.map((c) => c.id)
      ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
      updateSortOrders(newOrder)
      setCharacters(loadCharacters())
    },
    [characters]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    deleteCharacter(deleteTarget.id)
    setCharacters(loadCharacters())
    addToast(`「${deleteTarget.name}」を削除しました`)
    setDeleteTarget(null)
  }, [deleteTarget, addToast])

  const handleImport = useCallback(
    (importData: CharacterSheetData, mode: ImportMode) => {
      const current = loadData()
      if (mode === 'replace') {
        saveData({ ...importData, version: DATA_VERSION })
      } else {
        // 追加インポート: ID重複は新IDに変換
        const existingIds = new Set(current.characters.map((c) => c.id))
        const newChars = importData.characters.map((c) => {
          if (existingIds.has(c.id)) {
            return { ...c, id: generateId() }
          }
          return c
        })
        const maxOrder = current.characters.length > 0
          ? Math.max(...current.characters.map((c) => c.sortOrder))
          : -1
        const adjusted = newChars.map((c, i) => ({ ...c, sortOrder: maxOrder + 1 + i }))
        saveData({
          version: DATA_VERSION,
          characters: [...current.characters, ...adjusted],
        })
      }
      setCharacters(loadCharacters())
    },
    []
  )

  const allData = useMemo<CharacterSheetData>(
    () => ({ version: DATA_VERSION, characters }),
    [characters]
  )

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              キャラクターシート
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <GistSync data={allData} onSynced={() => setCharacters(loadCharacters())} onToast={addToast} />
              <ImportExport data={allData} onImport={handleImport} onToast={addToast} />
              <Link
                href="/characters/new"
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors min-h-[44px] flex items-center"
              >
                ＋ 追加
              </Link>
            </div>
          </div>
          {/* 検索 */}
          <div className="mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="キャラクター名で検索..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="キャラクター名で検索"
            />
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {characters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              キャラクターがまだ登録されていません。
            </p>
            <Link
              href="/characters/new"
              className="inline-flex items-center px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              キャラクターを追加
            </Link>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              「{searchQuery}」に一致するキャラクターが見つかりません
            </p>
          </div>
        ) : (
          <>
            {isSearching && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {filteredCharacters.length}件が見つかりました
                <span className="ml-2 text-xs">（検索中は並び替えできません）</span>
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCharacters.map((character, index) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  index={isSearching ? index : characters.findIndex((c) => c.id === character.id)}
                  total={isSearching ? filteredCharacters.length : characters.length}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isSearching={isSearching}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="キャラクターを削除"
        message={`「${deleteTarget?.name}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDanger
      />
    </div>
  )
}
