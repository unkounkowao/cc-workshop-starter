import { SCHEDULE_STORAGE_KEY, SCHEDULE_DATA_VERSION } from './constants'
import type { ScheduleData, StoryYear, ScheduleEntry, StoryMonth } from './types'

function getDefaultData(): ScheduleData {
  return { version: SCHEDULE_DATA_VERSION, years: [], entries: [] }
}

export function loadScheduleData(): ScheduleData {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY)
    if (!raw) return getDefaultData()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return getDefaultData()
    if (!Array.isArray(parsed.years)) return getDefaultData()
    if (!Array.isArray(parsed.entries)) return getDefaultData()
    return parsed as ScheduleData
  } catch {
    return getDefaultData()
  }
}

export function saveScheduleData(data: ScheduleData): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('スケジュールデータの保存に失敗しました:', e)
    throw new Error('データの保存に失敗しました。ブラウザのストレージ容量を確認してください。')
  }
}

// 年一覧（並び順でソート）
export function loadYears(): StoryYear[] {
  const data = loadScheduleData()
  return [...data.years].sort((a, b) => a.sortOrder - b.sortOrder)
}

// 年1件を取得
export function loadYear(id: string): StoryYear | null {
  const data = loadScheduleData()
  return data.years.find((y) => y.id === id) ?? null
}

// 年を保存（追加または更新）
export function saveYear(year: StoryYear): void {
  const data = loadScheduleData()
  const index = data.years.findIndex((y) => y.id === year.id)
  if (index >= 0) {
    data.years[index] = year
  } else {
    data.years.push(year)
  }
  saveScheduleData(data)
}

// 年を削除（関連エントリも削除）
export function deleteYear(id: string): void {
  const data = loadScheduleData()
  data.years = data.years.filter((y) => y.id !== id)
  data.entries = data.entries.filter((e) => e.yearId !== id)
  saveScheduleData(data)
}

// 年の並び順更新
export function updateYearSortOrders(orderedIds: string[]): void {
  const data = loadScheduleData()
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    const year = data.years.find((y) => y.id === id)
    if (year) {
      year.sortOrder = index
      year.updatedAt = now
    }
  })
  saveScheduleData(data)
}

// 次の年のsortOrderを取得
export function getNextYearSortOrder(): number {
  const data = loadScheduleData()
  if (data.years.length === 0) return 0
  return Math.max(...data.years.map((y) => y.sortOrder)) + 1
}

// エントリ一覧（yearIdで絞り込み、並び順でソート）
export function loadEntries(yearId?: string): ScheduleEntry[] {
  const data = loadScheduleData()
  const filtered = yearId ? data.entries.filter((e) => e.yearId === yearId) : data.entries
  return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder)
}

// エントリ1件を取得
export function loadEntry(id: string): ScheduleEntry | null {
  const data = loadScheduleData()
  return data.entries.find((e) => e.id === id) ?? null
}

// エントリを保存（追加または更新）
export function saveEntry(entry: ScheduleEntry): void {
  const data = loadScheduleData()
  const index = data.entries.findIndex((e) => e.id === entry.id)
  if (index >= 0) {
    data.entries[index] = entry
  } else {
    data.entries.push(entry)
  }
  saveScheduleData(data)
}

// エントリを削除
export function deleteEntry(id: string): void {
  const data = loadScheduleData()
  data.entries = data.entries.filter((e) => e.id !== id)
  // 他エントリのrelatedEntryIdsからも削除
  data.entries.forEach((e) => {
    e.relatedEntryIds = e.relatedEntryIds.filter((rid) => rid !== id)
  })
  saveScheduleData(data)
}

// 月内のエントリ並び順更新
export function updateEntrySortOrders(orderedIds: string[]): void {
  const data = loadScheduleData()
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    const entry = data.entries.find((e) => e.id === id)
    if (entry) {
      entry.sortOrder = index
      entry.updatedAt = now
    }
  })
  saveScheduleData(data)
}

// 次のエントリのsortOrderを取得（月内）
export function getNextEntrySortOrder(yearId: string, monthId: string): number {
  const data = loadScheduleData()
  const monthEntries = data.entries.filter((e) => e.yearId === yearId && e.monthId === monthId)
  if (monthEntries.length === 0) return 0
  return Math.max(...monthEntries.map((e) => e.sortOrder)) + 1
}

// 月内のエントリをソートして返す
export function sortEntriesInMonth(entries: ScheduleEntry[]): ScheduleEntry[] {
  return [...entries].sort((a, b) => {
    // startDayがあれば優先
    if (a.startDay !== undefined && b.startDay !== undefined) {
      if (a.startDay !== b.startDay) return a.startDay - b.startDay
    } else if (a.startDay !== undefined) {
      return -1
    } else if (b.startDay !== undefined) {
      return 1
    }
    // 次にsortOrder
    return a.sortOrder - b.sortOrder
  })
}

// 月オブジェクトをIDで取得（年のmonths配列から）
export function findMonthById(year: StoryYear, monthId: string): StoryMonth | null {
  return year.months.find((m) => m.id === monthId) ?? null
}

// 年に属するエントリ件数
export function countEntriesForYear(yearId: string): number {
  const data = loadScheduleData()
  return data.entries.filter((e) => e.yearId === yearId).length
}
