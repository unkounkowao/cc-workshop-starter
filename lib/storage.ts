import { STORAGE_KEY, LAST_MODIFIED_KEY, DELETED_IDS_KEY, DEFAULT_DATA } from './constants'
import type { Character, CharacterSheetData } from './types'

// LocalStorageからデータを読み込む（失敗時は初期値を返す）
export function loadData(): CharacterSheetData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_DATA, characters: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_DATA, characters: [] }
    if (!Array.isArray(parsed.characters)) return { ...DEFAULT_DATA, characters: [] }
    return parsed as CharacterSheetData
  } catch {
    return { ...DEFAULT_DATA, characters: [] }
  }
}

// LocalStorageへデータを保存する
// updateModifiedAt: ユーザー操作による変更の場合true（Gistからの読み込み時はfalse）
export function saveData(data: CharacterSheetData, updateModifiedAt = true): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    if (updateModifiedAt) {
      localStorage.setItem(LAST_MODIFIED_KEY, new Date().toISOString())
    }
  } catch (e) {
    console.error('データの保存に失敗しました:', e)
    throw new Error('データの保存に失敗しました。ブラウザのストレージ容量を確認してください。')
  }
}

// キャラクター一覧を取得（並び順でソート）
export function loadCharacters(): Character[] {
  const data = loadData()
  return [...data.characters].sort((a, b) => a.sortOrder - b.sortOrder)
}

// キャラクター1件を取得
export function loadCharacter(id: string): Character | null {
  const data = loadData()
  return data.characters.find((c) => c.id === id) ?? null
}

// キャラクターを保存（追加または更新）
export function saveCharacter(character: Character): void {
  const data = loadData()
  const index = data.characters.findIndex((c) => c.id === character.id)
  if (index >= 0) {
    data.characters[index] = character
  } else {
    data.characters.push(character)
  }
  saveData(data)
}

// キャラクターを削除
export function deleteCharacter(id: string): void {
  const data = loadData()
  data.characters = data.characters.filter((c) => c.id !== id)
  saveData(data)
  // 削除IDを記録（マージ時にGistから復元されないよう）
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY)
    const deleted: { id: string; deletedAt: string }[] = raw ? JSON.parse(raw) : []
    deleted.push({ id, deletedAt: new Date().toISOString() })
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted))
  } catch { /* ignore */ }
}

// 並び順を更新
export function updateSortOrders(orderedIds: string[]): void {
  const data = loadData()
  const now = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    const char = data.characters.find((c) => c.id === id)
    if (char) {
      char.sortOrder = index
      char.updatedAt = now
    }
  })
  saveData(data)
}

// 新しいキャラクターのデフォルトsortOrderを取得
export function getNextSortOrder(): number {
  const data = loadData()
  if (data.characters.length === 0) return 0
  return Math.max(...data.characters.map((c) => c.sortOrder)) + 1
}
