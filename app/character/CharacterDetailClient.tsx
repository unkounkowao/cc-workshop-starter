'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadCharacter, deleteCharacter } from '@/lib/storage'
import type { Character } from '@/lib/types'
import CharacterDetail from '@/components/CharacterDetail'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function CharacterDetailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!id) {
      setCharacter(null)
      return
    }
    setCharacter(loadCharacter(id))
  }, [id])

  const handleDelete = () => {
    if (!character) return
    deleteCharacter(character.id)
    router.push('/')
  }

  if (character === undefined) return null

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            キャラクターが見つかりません
          </p>
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 min-h-[44px]"
          >
            ← 一覧へ
          </Link>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {character.name}
            </h1>
            {character.nameReading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{character.nameReading}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/character/edit?id=${character.id}`}
              className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors min-h-[44px] flex items-center"
            >
              編集
            </Link>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px]"
            >
              削除
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <CharacterDetail character={character} />
      </main>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="キャラクターを削除"
        message={`「${character.name}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isDanger
      />
    </div>
  )
}
