import { Suspense } from 'react'
import CharacterDetailClient from './CharacterDetailClient'

export default function CharacterPage() {
  return (
    <Suspense fallback={null}>
      <CharacterDetailClient />
    </Suspense>
  )
}
