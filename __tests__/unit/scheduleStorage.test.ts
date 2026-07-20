import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadScheduleData,
  saveYear,
  loadYears,
  deleteYear,
  updateYearSortOrders,
  getNextYearSortOrder,
  saveEntry,
  loadEntries,
  deleteEntry,
  sortEntriesInMonth,
  countEntriesForYear,
} from '@/lib/scheduleStorage'
import { DEFAULT_MONTH_NAMES, SCHEDULE_STORAGE_KEY } from '@/lib/constants'
import type { StoryYear, ScheduleEntry } from '@/lib/types'

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorageMock.clear()
})

// ヘルパーファクトリー
function makeYear(id: string, sortOrder = 0): StoryYear {
  return {
    id,
    name: `テスト年 ${id}`,
    months: DEFAULT_MONTH_NAMES.map((name, i) => ({
      id: `month-${id}-${i}`,
      name,
      monthNumber: i + 1,
    })),
    sortOrder,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

function makeEntry(
  id: string,
  yearId: string,
  monthId: string,
  type: 'official' | 'plot' = 'official',
  sortOrder = 0
): ScheduleEntry {
  return {
    id,
    yearId,
    monthId,
    type,
    title: `テストエントリ ${id}`,
    relatedCharacterIds: [],
    relatedEntryIds: [],
    relatedWorldImageIds: [],
    sortOrder,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('loadScheduleData', () => {
  it('データがない場合は空の初期値を返す', () => {
    const data = loadScheduleData()
    expect(data.years).toEqual([])
    expect(data.entries).toEqual([])
  })

  it('壊れたJSONに対してフォールバックする', () => {
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, 'invalid-json{{{')
    const data = loadScheduleData()
    expect(data.years).toEqual([])
    expect(data.entries).toEqual([])
  })

  it('yearsが配列でない場合はフォールバックする', () => {
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ version: 1, years: 'bad', entries: [] }))
    const data = loadScheduleData()
    expect(data.years).toEqual([])
  })

  it('entriesが配列でない場合はフォールバックする', () => {
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ version: 1, years: [], entries: null }))
    const data = loadScheduleData()
    expect(data.entries).toEqual([])
  })

  it('保存データを正しく読み込む', () => {
    const year = makeYear('y1')
    const entry = makeEntry('e1', 'y1', 'month-y1-0')
    localStorageMock.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ version: 1, years: [year], entries: [entry] }))
    const data = loadScheduleData()
    expect(data.years).toHaveLength(1)
    expect(data.entries).toHaveLength(1)
  })
})

describe('saveYear / loadYears', () => {
  it('年を保存して取得できる', () => {
    saveYear(makeYear('y1', 0))
    saveYear(makeYear('y2', 1))
    const years = loadYears()
    expect(years).toHaveLength(2)
  })

  it('sortOrderで昇順ソートされる', () => {
    saveYear(makeYear('yb', 2))
    saveYear(makeYear('ya', 0))
    saveYear(makeYear('yc', 1))
    const years = loadYears()
    expect(years[0].id).toBe('ya')
    expect(years[1].id).toBe('yc')
    expect(years[2].id).toBe('yb')
  })

  it('既存の年を更新できる', () => {
    const year = makeYear('y1', 0)
    saveYear(year)
    const updated = { ...year, name: '更新後の名前' }
    saveYear(updated)
    const years = loadYears()
    expect(years).toHaveLength(1)
    expect(years[0].name).toBe('更新後の名前')
  })
})

describe('deleteYear', () => {
  it('年を削除できる', () => {
    saveYear(makeYear('y1'))
    saveYear(makeYear('y2'))
    deleteYear('y1')
    const years = loadYears()
    expect(years).toHaveLength(1)
    expect(years[0].id).toBe('y2')
  })

  it('関連するエントリも削除される', () => {
    saveYear(makeYear('y1'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y1', 'month-y1-1'))
    deleteYear('y1')
    const entries = loadEntries('y1')
    expect(entries).toHaveLength(0)
  })

  it('他の年のエントリは削除されない', () => {
    saveYear(makeYear('y1'))
    saveYear(makeYear('y2'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y2', 'month-y2-0'))
    deleteYear('y1')
    const entries = loadEntries('y2')
    expect(entries).toHaveLength(1)
  })
})

describe('updateYearSortOrders', () => {
  it('並び順を更新できる', () => {
    saveYear(makeYear('ya', 0))
    saveYear(makeYear('yb', 1))
    saveYear(makeYear('yc', 2))
    updateYearSortOrders(['yc', 'ya', 'yb'])
    const years = loadYears()
    expect(years[0].id).toBe('yc')
    expect(years[1].id).toBe('ya')
    expect(years[2].id).toBe('yb')
  })
})

describe('getNextYearSortOrder', () => {
  it('データがない場合は0を返す', () => {
    expect(getNextYearSortOrder()).toBe(0)
  })

  it('最大sortOrder + 1を返す', () => {
    saveYear(makeYear('ya', 0))
    saveYear(makeYear('yb', 3))
    saveYear(makeYear('yc', 1))
    expect(getNextYearSortOrder()).toBe(4)
  })
})

describe('saveEntry / loadEntries', () => {
  it('エントリを保存して取得できる', () => {
    saveYear(makeYear('y1'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y1', 'month-y1-0'))
    const entries = loadEntries('y1')
    expect(entries).toHaveLength(2)
  })

  it('yearIdで絞り込める', () => {
    saveYear(makeYear('y1'))
    saveYear(makeYear('y2'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y2', 'month-y2-0'))
    const y1Entries = loadEntries('y1')
    expect(y1Entries).toHaveLength(1)
    expect(y1Entries[0].id).toBe('e1')
  })

  it('yearId未指定で全エントリを返す', () => {
    saveYear(makeYear('y1'))
    saveYear(makeYear('y2'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y2', 'month-y2-0'))
    const allEntries = loadEntries()
    expect(allEntries).toHaveLength(2)
  })

  it('sortOrderで昇順ソートされる', () => {
    saveYear(makeYear('y1'))
    saveEntry(makeEntry('eb', 'y1', 'month-y1-0', 'official', 2))
    saveEntry(makeEntry('ea', 'y1', 'month-y1-0', 'official', 0))
    saveEntry(makeEntry('ec', 'y1', 'month-y1-0', 'official', 1))
    const entries = loadEntries('y1')
    expect(entries[0].id).toBe('ea')
    expect(entries[1].id).toBe('ec')
    expect(entries[2].id).toBe('eb')
  })

  it('既存のエントリを更新できる', () => {
    saveYear(makeYear('y1'))
    const entry = makeEntry('e1', 'y1', 'month-y1-0')
    saveEntry(entry)
    const updated = { ...entry, title: '更新後タイトル' }
    saveEntry(updated)
    const entries = loadEntries('y1')
    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe('更新後タイトル')
  })
})

describe('deleteEntry', () => {
  it('エントリを削除できる', () => {
    saveYear(makeYear('y1'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y1', 'month-y1-0'))
    deleteEntry('e1')
    const entries = loadEntries('y1')
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('e2')
  })

  it('他エントリのrelatedEntryIdsからも削除される', () => {
    saveYear(makeYear('y1'))
    const e1 = makeEntry('e1', 'y1', 'month-y1-0')
    const e2: ScheduleEntry = { ...makeEntry('e2', 'y1', 'month-y1-0'), relatedEntryIds: ['e1'] }
    saveEntry(e1)
    saveEntry(e2)
    deleteEntry('e1')
    const entries = loadEntries('y1')
    expect(entries).toHaveLength(1)
    expect(entries[0].relatedEntryIds).not.toContain('e1')
  })
})

describe('sortEntriesInMonth', () => {
  it('startDayがある場合は優先してソートされる', () => {
    const e1: ScheduleEntry = { ...makeEntry('e1', 'y1', 'm1', 'official', 0), startDay: 15 }
    const e2: ScheduleEntry = { ...makeEntry('e2', 'y1', 'm1', 'official', 1), startDay: 5 }
    const e3: ScheduleEntry = { ...makeEntry('e3', 'y1', 'm1', 'official', 2), startDay: 20 }
    const sorted = sortEntriesInMonth([e1, e2, e3])
    expect(sorted[0].id).toBe('e2')
    expect(sorted[1].id).toBe('e1')
    expect(sorted[2].id).toBe('e3')
  })

  it('startDayがない場合はsortOrderでソートされる', () => {
    const e1 = makeEntry('e1', 'y1', 'm1', 'official', 2)
    const e2 = makeEntry('e2', 'y1', 'm1', 'official', 0)
    const e3 = makeEntry('e3', 'y1', 'm1', 'official', 1)
    const sorted = sortEntriesInMonth([e1, e2, e3])
    expect(sorted[0].id).toBe('e2')
    expect(sorted[1].id).toBe('e3')
    expect(sorted[2].id).toBe('e1')
  })

  it('startDayがある要素はない要素より先に来る', () => {
    const e1 = makeEntry('e1', 'y1', 'm1', 'official', 0)
    const e2: ScheduleEntry = { ...makeEntry('e2', 'y1', 'm1', 'official', 1), startDay: 10 }
    const sorted = sortEntriesInMonth([e1, e2])
    expect(sorted[0].id).toBe('e2')
    expect(sorted[1].id).toBe('e1')
  })

  it('startDayが同じ場合はsortOrderでソートされる', () => {
    const e1: ScheduleEntry = { ...makeEntry('e1', 'y1', 'm1', 'official', 2), startDay: 10 }
    const e2: ScheduleEntry = { ...makeEntry('e2', 'y1', 'm1', 'official', 0), startDay: 10 }
    const sorted = sortEntriesInMonth([e1, e2])
    expect(sorted[0].id).toBe('e2')
    expect(sorted[1].id).toBe('e1')
  })

  it('元の配列を変更しない', () => {
    const entries = [makeEntry('e1', 'y1', 'm1', 'official', 1), makeEntry('e2', 'y1', 'm1', 'official', 0)]
    const original = [...entries]
    sortEntriesInMonth(entries)
    expect(entries[0].id).toBe(original[0].id)
  })
})

describe('countEntriesForYear', () => {
  it('指定した年のエントリ件数を返す', () => {
    saveYear(makeYear('y1'))
    saveYear(makeYear('y2'))
    saveEntry(makeEntry('e1', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e2', 'y1', 'month-y1-0'))
    saveEntry(makeEntry('e3', 'y2', 'month-y2-0'))
    expect(countEntriesForYear('y1')).toBe(2)
    expect(countEntriesForYear('y2')).toBe(1)
  })

  it('エントリがない場合は0を返す', () => {
    saveYear(makeYear('y1'))
    expect(countEntriesForYear('y1')).toBe(0)
  })
})
