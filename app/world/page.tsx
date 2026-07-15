import { Suspense } from 'react'
import WorldGalleryClient from './WorldGalleryClient'

export default function WorldPage() {
  return (
    <Suspense fallback={null}>
      <WorldGalleryClient />
    </Suspense>
  )
}
