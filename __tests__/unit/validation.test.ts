import { describe, it, expect } from 'vitest'
import {
  isValidHex,
  normalizeHex,
  isEmpty,
  isEmptyColorArray,
  validateCharacterName,
  validateImageColor,
  validateImportData,
} from '@/lib/validation'

describe('isValidHex', () => {
  it('有効な6桁HEXを受け入れる', () => {
    expect(isValidHex('#FF0000')).toBe(true)
    expect(isValidHex('#000000')).toBe(true)
    expect(isValidHex('#ffffff')).toBe(true)
  })
  it('有効な3桁HEXを受け入れる', () => {
    expect(isValidHex('#FFF')).toBe(true)
    expect(isValidHex('#abc')).toBe(true)
  })
  it('無効なHEXを拒否する', () => {
    expect(isValidHex('FF0000')).toBe(false)
    expect(isValidHex('#GG0000')).toBe(false)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('')).toBe(false)
  })
})

describe('normalizeHex', () => {
  it('6桁HEXを大文字化する', () => {
    expect(normalizeHex('#ff0000')).toBe('#FF0000')
  })
  it('3桁HEXを6桁に展開する', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
    expect(normalizeHex('#FFF')).toBe('#FFFFFF')
  })
})

describe('isEmpty', () => {
  it('空文字を未入力とみなす', () => {
    expect(isEmpty('')).toBe(true)
  })
  it('空白のみの文字列を未入力とみなす', () => {
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty('\n\t')).toBe(true)
  })
  it('undefinedを未入力とみなす', () => {
    expect(isEmpty(undefined)).toBe(true)
  })
  it('nullを未入力とみなす', () => {
    expect(isEmpty(null)).toBe(true)
  })
  it('内容のある文字列は未入力でない', () => {
    expect(isEmpty('田中')).toBe(false)
    expect(isEmpty(' 田中 ')).toBe(false)
  })
})

describe('isEmptyColorArray', () => {
  it('空配列を未入力とみなす', () => {
    expect(isEmptyColorArray([])).toBe(true)
  })
  it('要素のある配列は未入力でない', () => {
    expect(isEmptyColorArray([{ id: '1', hex: '#FF0000' }])).toBe(false)
  })
})

describe('validateCharacterName', () => {
  it('空名前はエラーを返す', () => {
    expect(validateCharacterName('')).not.toBeNull()
    expect(validateCharacterName('  ')).not.toBeNull()
  })
  it('有効な名前はnullを返す', () => {
    expect(validateCharacterName('田中')).toBeNull()
  })
})

describe('validateImageColor', () => {
  it('無効なHEXはエラーを返す', () => {
    expect(validateImageColor({ id: '1', hex: 'invalid' })).not.toBeNull()
  })
  it('有効なHEXはnullを返す', () => {
    expect(validateImageColor({ id: '1', hex: '#FF0000' })).toBeNull()
  })
})

describe('validateImportData', () => {
  it('有効なデータを受け入れる', () => {
    const data = {
      version: 1,
      characters: [
        {
          id: 'abc',
          name: 'テスト',
          sortOrder: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          imageColors: [],
        },
      ],
    }
    expect(validateImportData(data)).toBe(true)
  })
  it('characters配列がない場合は拒否', () => {
    expect(validateImportData({ version: 1 })).toBe(false)
  })
  it('nullは拒否', () => {
    expect(validateImportData(null)).toBe(false)
  })
  it('不正なcharactersは拒否', () => {
    expect(validateImportData({ version: 1, characters: [{ name: 'only name' }] })).toBe(false)
  })
})
