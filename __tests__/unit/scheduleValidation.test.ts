import { describe, it, expect } from 'vitest'
import {
  validateEntryTitle,
  validateDateRange,
  validateNoSelfReference,
  validateScheduleEntry,
  validateStoryYear,
  normalizeString,
  parseOptionalDay,
  validateScheduleImportData,
} from '@/lib/scheduleValidation'

describe('validateEntryTitle', () => {
  it('空文字列はエラーを返す', () => {
    expect(validateEntryTitle('')).not.toBeNull()
  })

  it('空白のみの文字列はエラーを返す', () => {
    expect(validateEntryTitle('   ')).not.toBeNull()
  })

  it('有効なタイトルはnullを返す', () => {
    expect(validateEntryTitle('タイトル')).toBeNull()
  })

  it('エラーメッセージに「必須」が含まれる', () => {
    expect(validateEntryTitle('')).toContain('必須')
  })
})

describe('validateDateRange', () => {
  it('両方undefinedの場合はnullを返す', () => {
    expect(validateDateRange(undefined, undefined)).toBeNull()
  })

  it('開始日のみ有効な場合はnullを返す', () => {
    expect(validateDateRange(5, undefined)).toBeNull()
  })

  it('終了日のみ有効な場合はnullを返す', () => {
    expect(validateDateRange(undefined, 10)).toBeNull()
  })

  it('開始日 <= 終了日の場合はnullを返す', () => {
    expect(validateDateRange(5, 10)).toBeNull()
    expect(validateDateRange(5, 5)).toBeNull()
  })

  it('開始日 > 終了日の場合はエラーを返す', () => {
    const result = validateDateRange(15, 10)
    expect(result).not.toBeNull()
    expect(result).toContain('開始日')
  })

  it('開始日が範囲外（0以下）の場合はエラーを返す', () => {
    expect(validateDateRange(0, undefined)).not.toBeNull()
  })

  it('開始日が範囲外（32以上）の場合はエラーを返す', () => {
    expect(validateDateRange(32, undefined)).not.toBeNull()
  })

  it('終了日が範囲外（0以下）の場合はエラーを返す', () => {
    expect(validateDateRange(undefined, 0)).not.toBeNull()
  })

  it('終了日が範囲外（32以上）の場合はエラーを返す', () => {
    expect(validateDateRange(undefined, 32)).not.toBeNull()
  })
})

describe('validateNoSelfReference', () => {
  it('自分自身が含まれていない場合はnullを返す', () => {
    expect(validateNoSelfReference('e1', ['e2', 'e3'])).toBeNull()
  })

  it('配列が空の場合はnullを返す', () => {
    expect(validateNoSelfReference('e1', [])).toBeNull()
  })

  it('自分自身が含まれている場合はエラーを返す', () => {
    const result = validateNoSelfReference('e1', ['e2', 'e1', 'e3'])
    expect(result).not.toBeNull()
  })
})

describe('validateScheduleEntry', () => {
  it('タイトルが空の場合はtitleエラーが返る', () => {
    const errors = validateScheduleEntry({ title: '', yearId: 'y1', monthId: 'm1' })
    expect(errors.title).toBeDefined()
  })

  it('yearIdがない場合はyearIdエラーが返る', () => {
    const errors = validateScheduleEntry({ title: 'テスト', yearId: undefined, monthId: 'm1' })
    expect(errors.yearId).toBeDefined()
  })

  it('monthIdがない場合はmonthIdエラーが返る', () => {
    const errors = validateScheduleEntry({ title: 'テスト', yearId: 'y1', monthId: undefined })
    expect(errors.monthId).toBeDefined()
  })

  it('正常なデータの場合はエラーなし', () => {
    const errors = validateScheduleEntry({
      title: 'タイトル',
      yearId: 'y1',
      monthId: 'm1',
      relatedEntryIds: [],
    })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('開始日 > 終了日の場合はdateRangeエラーが返る', () => {
    const errors = validateScheduleEntry({
      title: 'タイトル',
      yearId: 'y1',
      monthId: 'm1',
      startDay: 20,
      endDay: 10,
    })
    expect(errors.dateRange).toBeDefined()
  })

  it('自己参照がある場合はrelatedEntryIdsエラーが返る', () => {
    const errors = validateScheduleEntry({
      id: 'e1',
      title: 'タイトル',
      yearId: 'y1',
      monthId: 'm1',
      relatedEntryIds: ['e1'],
    })
    expect(errors.relatedEntryIds).toBeDefined()
  })
})

describe('validateStoryYear', () => {
  it('nameが空の場合はエラーを返す', () => {
    const errors = validateStoryYear({ name: '' })
    expect(errors.name).toBeDefined()
  })

  it('nameが空白のみの場合はエラーを返す', () => {
    const errors = validateStoryYear({ name: '  ' })
    expect(errors.name).toBeDefined()
  })

  it('有効なnameの場合はエラーなし', () => {
    const errors = validateStoryYear({ name: '第一部' })
    expect(Object.keys(errors)).toHaveLength(0)
  })
})

describe('normalizeString', () => {
  it('undefinedはundefinedを返す', () => {
    expect(normalizeString(undefined)).toBeUndefined()
  })

  it('空文字列はundefinedを返す', () => {
    expect(normalizeString('')).toBeUndefined()
  })

  it('空白のみの文字列はundefinedを返す', () => {
    expect(normalizeString('   ')).toBeUndefined()
  })

  it('前後の空白がトリムされる', () => {
    expect(normalizeString('  hello  ')).toBe('hello')
  })

  it('通常の文字列はそのまま返す', () => {
    expect(normalizeString('テスト')).toBe('テスト')
  })
})

describe('parseOptionalDay', () => {
  it('undefinedはundefinedを返す', () => {
    expect(parseOptionalDay(undefined)).toBeUndefined()
  })

  it('空文字列はundefinedを返す', () => {
    expect(parseOptionalDay('')).toBeUndefined()
  })

  it('空白のみの文字列はundefinedを返す', () => {
    expect(parseOptionalDay('  ')).toBeUndefined()
  })

  it('有効な数値文字列はnumberを返す', () => {
    expect(parseOptionalDay('15')).toBe(15)
  })

  it('前後に空白がある数値文字列も正しく解析される', () => {
    expect(parseOptionalDay(' 5 ')).toBe(5)
  })

  it('数値以外の文字列はundefinedを返す', () => {
    expect(parseOptionalDay('abc')).toBeUndefined()
  })

  it('"0"は0を返す', () => {
    expect(parseOptionalDay('0')).toBe(0)
  })
})

describe('validateScheduleImportData', () => {
  it('正常なデータはtrueを返す', () => {
    const validData = {
      version: 1,
      years: [
        {
          id: 'y1',
          name: 'テスト年',
          months: [],
          sortOrder: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      entries: [
        {
          id: 'e1',
          yearId: 'y1',
          monthId: 'm1',
          type: 'official',
          title: 'テスト',
          relatedCharacterIds: [],
          relatedEntryIds: [],
          sortOrder: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
    }
    expect(validateScheduleImportData(validData)).toBe(true)
  })

  it('nullはfalseを返す', () => {
    expect(validateScheduleImportData(null)).toBe(false)
  })

  it('非オブジェクトはfalseを返す', () => {
    expect(validateScheduleImportData('string')).toBe(false)
    expect(validateScheduleImportData(42)).toBe(false)
  })

  it('versionがない場合はfalseを返す', () => {
    expect(validateScheduleImportData({ years: [], entries: [] })).toBe(false)
  })

  it('yearsが配列でない場合はfalseを返す', () => {
    expect(validateScheduleImportData({ version: 1, years: 'bad', entries: [] })).toBe(false)
  })

  it('entriesが配列でない場合はfalseを返す', () => {
    expect(validateScheduleImportData({ version: 1, years: [], entries: null })).toBe(false)
  })

  it('yearsに必須フィールドがない場合はfalseを返す', () => {
    const badData = {
      version: 1,
      years: [{ id: 'y1' }], // name, months, sortOrder, createdAt, updatedAt がない
      entries: [],
    }
    expect(validateScheduleImportData(badData)).toBe(false)
  })

  it('entriesのtypeが不正な場合はfalseを返す', () => {
    const badData = {
      version: 1,
      years: [],
      entries: [
        {
          id: 'e1',
          yearId: 'y1',
          monthId: 'm1',
          type: 'invalid',
          title: 'テスト',
          relatedCharacterIds: [],
          relatedEntryIds: [],
          sortOrder: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
    }
    expect(validateScheduleImportData(badData)).toBe(false)
  })

  it('空のyearsとentriesはtrueを返す', () => {
    expect(validateScheduleImportData({ version: 1, years: [], entries: [] })).toBe(true)
  })
})
