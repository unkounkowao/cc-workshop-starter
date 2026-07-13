import { Suspense } from 'react'
import EditCharacterClient from './EditCharacterClient'

export default function EditCharacterPage() {
  return (
    <Suspense fallback={null}>
      <EditCharacterClient />
    </Suspense>
  )
}
