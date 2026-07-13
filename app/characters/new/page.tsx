'use client'
import { useRouter } from 'next/navigation'
import { saveCharacter } from '@/lib/storage'
import type { Character } from '@/lib/types'
import CharacterForm from '@/components/CharacterForm'

export default function NewCharacterPage() {
  const router = useRouter()

  const handleSave = (character: Character) => {
    saveCharacter(character)
    router.push(`/character?id=${character.id}`)
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CharacterForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  )
}
