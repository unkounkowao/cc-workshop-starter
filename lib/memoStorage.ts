import type { Memo, MemoData } from './types'

const MEMO_STORAGE_KEY = 'novel-memo-data'
export const MEMO_VERSION = 1
export const MEMO_DELETED_IDS_KEY = 'novel-memo-deleted-ids'

export function loadMemoData(): MemoData {
  try {
    const raw = localStorage.getItem(MEMO_STORAGE_KEY)
    if (!raw) return { version: MEMO_VERSION, memos: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.memos)) return { version: MEMO_VERSION, memos: [] }
    return parsed as MemoData
  } catch {
    return { version: MEMO_VERSION, memos: [] }
  }
}

export function saveMemoData(data: MemoData): void {
  localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(data))
}

export function loadMemos(): Memo[] {
  return loadMemoData().memos.sort((a, b) => a.sortOrder - b.sortOrder)
}

export function saveMemo(memo: Memo): void {
  const data = loadMemoData()
  const idx = data.memos.findIndex((m) => m.id === memo.id)
  if (idx >= 0) {
    data.memos[idx] = memo
  } else {
    data.memos.push(memo)
  }
  saveMemoData(data)
}

export function deleteMemo(id: string): void {
  const data = loadMemoData()
  data.memos = data.memos.filter((m) => m.id !== id)
  saveMemoData(data)
  try {
    const raw = localStorage.getItem(MEMO_DELETED_IDS_KEY)
    const deleted: { id: string; deletedAt: string }[] = raw ? JSON.parse(raw) : []
    deleted.push({ id, deletedAt: new Date().toISOString() })
    localStorage.setItem(MEMO_DELETED_IDS_KEY, JSON.stringify(deleted))
  } catch { /* ignore */ }
}

export function updateMemoSortOrders(orderedIds: string[]): void {
  const data = loadMemoData()
  const ts = new Date().toISOString()
  orderedIds.forEach((id, index) => {
    const m = data.memos.find((m) => m.id === id)
    if (m) { m.sortOrder = index; m.updatedAt = ts }
  })
  saveMemoData(data)
}

export function getNextMemoSortOrder(): number {
  const data = loadMemoData()
  if (data.memos.length === 0) return 0
  return Math.max(...data.memos.map((m) => m.sortOrder)) + 1
}
