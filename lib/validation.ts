import { HEX_COLOR_REGEX } from './constants'
import type { Character, CharacterSheetData, ImageColor } from './types'

// HEXカラーコードのバリデーション
export function isValidHex(hex: string): boolean {
  return HEX_COLOR_REGEX.test(hex)
}

// HEXカラーコードの正規化（大文字化、3桁→6桁展開）
export function normalizeHex(hex: string): string {
  const upper = hex.toUpperCase()
  if (/^#[0-9A-F]{3}$/.test(upper)) {
    const r = upper[1]
    const g = upper[2]
    const b = upper[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return upper
}

// 項目が未入力かどうかを判定
export function isEmpty(value: string | undefined | null): boolean {
  if (value === undefined || value === null) return true
  return value.trim() === ''
}

// ImageColor配列が未入力かどうかを判定
export function isEmptyColorArray(colors: ImageColor[]): boolean {
  return colors.length === 0
}

// キャラクター名のバリデーション
export function validateCharacterName(name: string): string | null {
  if (isEmpty(name)) return '名前は必須項目です'
  return null
}

// ImageColorのバリデーション
export function validateImageColor(color: ImageColor): string | null {
  if (!isValidHex(color.hex)) {
    return `カラーコード "${color.hex}" は無効です。#RRGGBB または #RGB 形式で入力してください`
  }
  return null
}

// キャラクター全体のバリデーション
export function validateCharacter(character: Partial<Character>): Record<string, string> {
  const errors: Record<string, string> = {}

  const nameError = validateCharacterName(character.name ?? '')
  if (nameError) errors.name = nameError

  const colors = character.imageColors ?? []
  colors.forEach((color, index) => {
    const err = validateImageColor(color)
    if (err) errors[`imageColors.${index}`] = err
  })

  return errors
}

// インポートデータのバリデーション
export function validateImportData(data: unknown): data is CharacterSheetData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (typeof d.version !== 'number') return false
  if (!Array.isArray(d.characters)) return false
  return d.characters.every((c: unknown) => {
    if (!c || typeof c !== 'object') return false
    const char = c as Record<string, unknown>
    return (
      typeof char.id === 'string' &&
      typeof char.name === 'string' &&
      typeof char.sortOrder === 'number' &&
      typeof char.createdAt === 'string' &&
      typeof char.updatedAt === 'string' &&
      Array.isArray(char.imageColors)
    )
  })
}
