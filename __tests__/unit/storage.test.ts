import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadData, loadCharacters, saveCharacter, deleteCharacter, updateSortOrders } from '@/lib/storage'
import { DATA_VERSION } from '@/lib/constants'

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

const makeChar = (id: string, sortOrder = 0) => ({
  id,
  name: `キャラ${id}`,
  imageColors: [],
  sortOrder,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
})

describe('loadData', () => {
  it('データがない場合は空の初期値を返す', () => {
    const data = loadData()
    expect(data.characters).toEqual([])
  })

  it('壊れたJSONに対してフォールバックする', () => {
    localStorageMock.setItem('novel-character-sheet-data', 'invalid-json{')
    const data = loadData()
    expect(data.characters).toEqual([])
  })

  it('保存データを正しく読み込む', () => {
    const testData = { version: DATA_VERSION, characters: [makeChar('1')] }
    localStorageMock.setItem('novel-character-sheet-data', JSON.stringify(testData))
    const data = loadData()
    expect(data.characters).toHaveLength(1)
  })
})

describe('saveCharacter / loadCharacters', () => {
  it('キャラクターを保存して取得できる', () => {
    saveCharacter(makeChar('1', 0))
    saveCharacter(makeChar('2', 1))
    const chars = loadCharacters()
    expect(chars).toHaveLength(2)
  })

  it('並び順でソートされる', () => {
    saveCharacter(makeChar('b', 1))
    saveCharacter(makeChar('a', 0))
    const chars = loadCharacters()
    expect(chars[0].id).toBe('a')
    expect(chars[1].id).toBe('b')
  })
})

describe('deleteCharacter', () => {
  it('キャラクターを削除できる', () => {
    saveCharacter(makeChar('1'))
    deleteCharacter('1')
    expect(loadCharacters()).toHaveLength(0)
  })
})

describe('updateSortOrders', () => {
  it('並び順を更新できる', () => {
    saveCharacter(makeChar('a', 0))
    saveCharacter(makeChar('b', 1))
    updateSortOrders(['b', 'a'])
    const chars = loadCharacters()
    expect(chars[0].id).toBe('b')
    expect(chars[1].id).toBe('a')
  })
})
