import { Suspense } from 'react'
import EditPlotClient from './EditPlotClient'

export default function EditPlotPage() {
  return (
    <Suspense fallback={null}>
      <EditPlotClient />
    </Suspense>
  )
}
