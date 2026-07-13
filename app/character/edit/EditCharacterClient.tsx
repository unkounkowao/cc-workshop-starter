'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadCharacter, saveCharacter } from '@/lib/storage'
import type { Character } from '@/lib/types'
import CharacterForm from '@/components/CharacterForm'

export default function EditCharacterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [character, setCharacter] = useState<Character | null | undefined>(undefined)

  useEffect(() => {
    if (!id) {
      setCharacter(null)
      return
    }
    setCharacter(loadCharacter(id))
  }, [id])

  const handleSave = (updated: Character) => {
    saveCharacter(updated)
    router.push(`/character?id=${updated.id}`)
  }

  const handleCancel = () => {
    if (character) {
      router.push(`/character?id=${character.id}`)
    } else {
      router.push('/')
    }
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CharacterForm
          initialCharacter={character}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
