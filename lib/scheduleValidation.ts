import { isEmpty } from './validation'
import type { ScheduleEntry, StoryYear } from './types'

export type ScheduleEntryErrors = Partial<Record<keyof ScheduleEntry | string, string>>

// エントリのタイトルバリデーション
export function validateEntryTitle(title: string): string | null {
  if (isEmpty(title)) return 'タイトルは必須項目です'
  return null
}

// 開始日と終了日の整合性バリデーション
export function validateDateRange(startDay?: number, endDay?: number): string | null {
  if (startDay !== undefined && endDay !== undefined) {
    if (startDay > endDay) return '開始日は終了日以前である必要があります'
    if (startDay < 1 || startDay > 31) return '開始日は1〜31の範囲で入力してください'
    if (endDay < 1 || endDay > 31) return '終了日は1〜31の範囲で入力してください'
  }
  if (startDay !== undefined && (startDay < 1 || startDay > 31)) {
    return '開始日は1〜31の範囲で入力してください'
  }
  if (endDay !== undefined && (endDay < 1 || endDay > 31)) {
    return '終了日は1〜31の範囲で入力してください'
  }
  return null
}

// 自己参照チェック
export function validateNoSelfReference(entryId: string, relatedEntryIds: string[]): string | null {
  if (relatedEntryIds.includes(entryId)) return '自分自身を関連項目に設定することはできません'
  return null
}

// エントリ全体のバリデーション
export function validateScheduleEntry(entry: Partial<ScheduleEntry>): ScheduleEntryErrors {
  const errors: ScheduleEntryErrors = {}

  const titleError = validateEntryTitle(entry.title ?? '')
  if (titleError) errors.title = titleError

  if (!entry.yearId) errors.yearId = '年を選択してください'
  if (!entry.monthId) errors.monthId = '月を選択してください'

  const dateError = validateDateRange(entry.startDay, entry.endDay)
  if (dateError) errors.dateRange = dateError

  if (entry.id && entry.relatedEntryIds) {
    const selfRefError = validateNoSelfReference(entry.id, entry.relatedEntryIds)
    if (selfRefError) errors.relatedEntryIds = selfRefError
  }

  return errors
}

// 年のバリデーション
export function validateStoryYear(year: Partial<StoryYear>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (isEmpty(year.name ?? '')) errors.name = '年の名称は必須項目です'
  return errors
}

// 月名のバリデーション
export function validateMonthName(name: string): string | null {
  if (isEmpty(name)) return '月の名称は必須項目です'
  return null
}

// スケジュールインポートデータのバリデーション
export function validateScheduleImportData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.version !== 'number') return false
  if (!Array.isArray(d.years)) return false
  if (!Array.isArray(d.entries)) return false

  const yearsValid = d.years.every((y: unknown) => {
    if (!y || typeof y !== 'object') return false
    const year = y as Record<string, unknown>
    return (
      typeof year.id === 'string' &&
      typeof year.name === 'string' &&
      Array.isArray(year.months) &&
      typeof year.sortOrder === 'number' &&
      typeof year.createdAt === 'string' &&
      typeof year.updatedAt === 'string'
    )
  })
  if (!yearsValid) return false

  const entriesValid = d.entries.every((e: unknown) => {
    if (!e || typeof e !== 'object') return false
    const entry = e as Record<string, unknown>
    return (
      typeof entry.id === 'string' &&
      typeof entry.yearId === 'string' &&
      typeof entry.monthId === 'string' &&
      (entry.type === 'official' || entry.type === 'plot') &&
      typeof entry.title === 'string' &&
      Array.isArray(entry.relatedCharacterIds) &&
      Array.isArray(entry.relatedEntryIds) &&
      typeof entry.sortOrder === 'number' &&
      typeof entry.createdAt === 'string' &&
      typeof entry.updatedAt === 'string'
    )
  })
  return entriesValid
}

// 空白のみの文字列を undefined に変換（保存前の正規化）
export function normalizeString(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

// 数値文字列を number | undefined に変換
export function parseOptionalDay(value: string | undefined): number | undefined {
  if (!value || value.trim() === '') return undefined
  const num = parseInt(value.trim(), 10)
  return isNaN(num) ? undefined : num
}
