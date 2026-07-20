import { Suspense } from 'react'
import EditOfficialClient from './EditOfficialClient'

export default function EditOfficialPage() {
  return (
    <Suspense fallback={null}>
      <EditOfficialClient />
    </Suspense>
  )
}
