'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ScheduleEntryForm from '@/components/ScheduleEntryForm'
import { loadEntry, saveEntry, loadYears } from '@/lib/scheduleStorage'
import type { ScheduleEntry, StoryYear } from '@/lib/types'

export default function EditOfficialClient() {
  const searchParams = useSearchParams()
  const entryId = searchParams.get('id') ?? ''
  const router = useRouter()
  const [entry, setEntry] = useState<ScheduleEntry | null>(null)
  const [years, setYears] = useState<StoryYear[]>([])
  const [notFound, setNotFound] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!entryId) { setNotFound(true); return }
    const e = loadEntry(entryId)
    if (!e || e.type !== 'official') { setNotFound(true); return }
    setEntry(e)
    setYears(loadYears())
  }, [entryId])

  if (!mounted) return null
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-slate-500">エントリが見つかりません</p>
      </div>
    )
  }
  if (!entry) return null

  const handleSave = (updated: ScheduleEntry) => {
    saveEntry(updated)
    router.push(`/schedule/official/detail?id=${updated.id}`)
  }

  return (
    <div className="min-h-screen">
      <ScheduleEntryForm
        type="official"
        initialEntry={entry}
        years={years}
        onSave={handleSave}
        onCancel={() => router.push(`/schedule/official/detail?id=${entryId}`)}
      />
    </div>
  )
}
