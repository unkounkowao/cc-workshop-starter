'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { loadCharacters, deleteCharacter, updateSortOrders } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { DATA_VERSION } from '@/lib/constants'
import type { Character, CharacterSheetData, Toast as ToastType } from '@/lib/types'
import CharacterCard from '@/components/CharacterCard'
import GistSync from '@/components/GistSync'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([])
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

  const allData = useMemo<CharacterSheetData>(
    () => ({ version: DATA_VERSION, characters }),
    [characters]
  )

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white border-b border-sky-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-base font-bold text-slate-800">キャラクター一覧</h1>
              {characters.length > 0 && (
                <p className="text-xs text-slate-400">{characters.length}人</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <GistSync data={allData} onSynced={() => setCharacters(loadCharacters())} onToast={addToast} />
              <Link
                href="/characters/new"
                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full transition-colors min-h-[40px] flex items-center shadow-sm"
              >
                ＋ 追加
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {characters.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-slate-400 mb-6 text-sm">
              まだキャラクターが登録されていません。
            </p>
            <Link
              href="/characters/new"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full transition-colors shadow-sm"
            >
              キャラクターを追加
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {characters.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={index}
                total={characters.length}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}
          </div>
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
