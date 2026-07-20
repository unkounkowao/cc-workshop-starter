import { Suspense } from 'react'
import PlotDetailClient from './PlotDetailClient'

export default function PlotDetailPage() {
  return (
    <Suspense fallback={null}>
      <PlotDetailClient />
    </Suspense>
  )
}
