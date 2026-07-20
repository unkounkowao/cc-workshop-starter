'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { loadCharacters, deleteCharacter, updateSortOrders } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { Character, Toast as ToastType } from '@/lib/types'
import CharacterCard from '@/components/CharacterCard'
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
    const onSync = () => setCharacters(loadCharacters())
    window.addEventListener('gist-synced', onSync)
    return () => window.removeEventListener('gist-synced', onSync)
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

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* ヒーローバナー */}
      <div className="bg-gradient-to-br from-sky-400 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-6xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-xs font-medium tracking-widest uppercase mb-1">Novel Character Sheet</p>
            <h1 className="text-3xl font-bold tracking-tight">登場人物</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/characters/new"
              className="px-5 py-2.5 text-sm font-medium text-sky-700 bg-white hover:bg-sky-50 rounded-full transition-colors shadow-sm"
            >
              ＋ 追加
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✏️</div>
            <p className="text-slate-400 mb-6 text-sm">
              まだ登場人物が登録されていません。
            </p>
            <Link
              href="/characters/new"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full transition-colors shadow-sm"
            >
              最初の登場人物を追加
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
        title="登場人物を削除"
        message={`「${deleteTarget?.name}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDanger
      />
    </div>
  )
}
