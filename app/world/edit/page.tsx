import { Suspense } from 'react'
import WorldImageEditClient from './WorldImageEditClient'

export default function WorldEditPage() {
  return (
    <Suspense fallback={null}>
      <WorldImageEditClient />
    </Suspense>
  )
}
