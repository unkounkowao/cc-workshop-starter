import { generateId, now } from './utils'
import { validateScheduleImportData } from './scheduleValidation'
import { loadScheduleData, saveScheduleData } from './scheduleStorage'
import { downloadJson } from './utils'
import type { ScheduleBackup, ScheduleImportResult, ScheduleImportMode, StoryYear, ScheduleEntry } from './types'

// バックアップJSONを生成してダウンロード
export function exportScheduleBackup(): void {
  const data = loadScheduleData()
  const backup: ScheduleBackup = {
    version: data.version,
    exportedAt: now(),
    years: data.years,
    entries: data.entries,
  }
  const date = new Date().toISOString().slice(0, 10)
  downloadJson(backup, `schedule-backup-${date}.json`)
}

// JSONからスケジュールを復元
export function importScheduleBackup(
  raw: unknown,
  mode: ScheduleImportMode
): ScheduleImportResult {
  if (!validateScheduleImportData(raw)) {
    return {
      success: false,
      yearsImported: 0,
      entriesImported: 0,
      yearsSkipped: 0,
      entriesSkipped: 0,
      errors: ['データ形式が不正です。有効なスケジュールバックアップファイルを選択してください。'],
    }
  }

  const backup = raw as ScheduleBackup
  const current = loadScheduleData()

  let yearsImported = 0
  let entriesImported = 0
  let yearsSkipped = 0
  let entriesSkipped = 0
  const errors: string[] = []

  if (mode === 'replace') {
    // 既存データを置き換え
    try {
      saveScheduleData({
        version: backup.version,
        years: backup.years,
        entries: backup.entries,
      })
      yearsImported = backup.years.length
      entriesImported = backup.entries.length
    } catch (e) {
      errors.push(`保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`)
      return { success: false, yearsImported: 0, entriesImported: 0, yearsSkipped: 0, entriesSkipped: 0, errors }
    }
  } else {
    // 既存データへ追加（ID重複時は新IDを生成）
    const existingYearIds = new Set(current.years.map((y) => y.id))
    const existingEntryIds = new Set(current.entries.map((e) => e.id))

    // yearIdマッピング（重複時に新IDへ）
    const yearIdMap: Record<string, string> = {}
    const newYears: StoryYear[] = []

    for (const year of backup.years) {
      if (existingYearIds.has(year.id)) {
        // 重複 → 新ID生成
        const newId = generateId()
        yearIdMap[year.id] = newId
        newYears.push({ ...year, id: newId })
        yearsImported++
      } else {
        yearIdMap[year.id] = year.id
        newYears.push(year)
        yearsImported++
      }
    }

    // monthIdマッピング（yearId変更に伴い月IDも再マッピング）
    const monthIdMap: Record<string, string> = {}
    for (const year of backup.years) {
      const newYearId = yearIdMap[year.id]
      const newYear = newYears.find((y) => y.id === newYearId)
      if (newYear && newYearId !== year.id) {
        // yearが新IDになった場合、月IDも再生成
        const newMonths = year.months.map((m) => {
          const newMonthId = generateId()
          monthIdMap[m.id] = newMonthId
          return { ...m, id: newMonthId }
        })
        newYear.months = newMonths
      } else {
        year.months.forEach((m) => { monthIdMap[m.id] = m.id })
      }
    }

    // entryIdマッピング
    const entryIdMap: Record<string, string> = {}
    const newEntries: ScheduleEntry[] = []

    for (const entry of backup.entries) {
      let entryId = entry.id
      if (existingEntryIds.has(entry.id)) {
        entryId = generateId()
        entriesSkipped++ // old behavior: skip
        entryIdMap[entry.id] = entryId
      } else {
        entryIdMap[entry.id] = entry.id
      }

      const newYearId = yearIdMap[entry.yearId] ?? entry.yearId
      const newMonthId = monthIdMap[entry.monthId] ?? entry.monthId

      newEntries.push({
        ...entry,
        id: entryId,
        yearId: newYearId,
        monthId: newMonthId,
      })
      entriesImported++
    }

    // relatedEntryIdsを再マッピング
    newEntries.forEach((e) => {
      e.relatedEntryIds = e.relatedEntryIds
        .map((rid) => entryIdMap[rid] ?? rid)
        .filter((rid) => rid !== e.id) // 自己参照排除
    })

    try {
      saveScheduleData({
        ...current,
        years: [...current.years, ...newYears],
        entries: [...current.entries, ...newEntries],
      })
    } catch (err) {
      errors.push(`保存に失敗しました: ${err instanceof Error ? err.message : String(err)}`)
      return { success: false, yearsImported: 0, entriesImported: 0, yearsSkipped, entriesSkipped, errors }
    }
  }

  return { success: true, yearsImported, entriesImported, yearsSkipped, entriesSkipped, errors }
}
