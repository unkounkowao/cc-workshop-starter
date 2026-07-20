import { Suspense } from 'react'
import OfficialDetailClient from './OfficialDetailClient'

export default function OfficialDetailPage() {
  return (
    <Suspense fallback={null}>
      <OfficialDetailClient />
    </Suspense>
  )
}
