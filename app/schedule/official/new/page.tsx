'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import ScheduleEntryForm from '@/components/ScheduleEntryForm'
import { loadYears, saveEntry } from '@/lib/scheduleStorage'
import type { ScheduleEntry, StoryYear } from '@/lib/types'

function NewOfficialContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultYearId = searchParams.get('yearId') ?? undefined
  const defaultMonthId = searchParams.get('monthId') ?? undefined
  const [years, setYears] = useState<StoryYear[]>([])

  useEffect(() => {
    setYears(loadYears())
  }, [])

  const handleSave = (entry: ScheduleEntry) => {
    saveEntry(entry)
    router.push(`/schedule/official/detail?id=${entry.id}`)
  }

  const handleCancel = () => {
    router.push('/schedule')
  }

  return (
    <div className="min-h-screen">
      <ScheduleEntryForm
        type="official"
        years={years}
        defaultYearId={defaultYearId}
        defaultMonthId={defaultMonthId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default function NewOfficialPage() {
  return (
    <Suspense fallback={null}>
      <NewOfficialContent />
    </Suspense>
  )
}
