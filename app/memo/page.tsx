'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadMemos,
  saveMemo,
  deleteMemo,
  updateMemoSortOrders,
  loadMemoData,
  saveMemoData,
  getNextMemoSortOrder,
  MEMO_DELETED_IDS_KEY,
  MEMO_VERSION,
} from '@/lib/memoStorage'
import { loadCharacters } from '@/lib/storage'
import { saveMemoToGist, loadMemoFromGist } from '@/lib/gist'
import { generateId } from '@/lib/utils'
import type { Memo, Character, Toast as ToastType } from '@/lib/types'
import MemoCard from '@/components/MemoCard'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

const TOKEN_KEY = 'novel-cs-gist-token'
const GIST_ID_KEY = 'novel-cs-gist-id'

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [mounted, setMounted] = useState(false)
  const [content, setContent] = useState('')
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [syncing, setSyncing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoDataRef = useRef(loadMemoData())

  const addToast = useCallback((message: string, type: ToastType['type'] = 'success') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const reload = useCallback(() => {
    const loaded = loadMemos()
    setMemos(loaded)
    memoDataRef.current = loadMemoData()
  }, [])

  useEffect(() => {
    setMounted(true)
    reload()
    setCharacters(loadCharacters())
  }, [reload])

  // Gist自動読み込み
  const autoLoad = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY) ?? ''
    const gistId = localStorage.getItem(GIST_ID_KEY) ?? ''
    if (!token || !gistId) return

    loadMemoFromGist(token, gistId).then((gistData) => {
      if (!gistData) return
      const localData = loadMemoData()

      const deletedRaw = localStorage.getItem(MEMO_DELETED_IDS_KEY)
      const deletedList: { id: string; deletedAt: string }[] = deletedRaw ? JSON.parse(deletedRaw) : []
      const deletedMap = new Map(deletedList.map((d) => [d.id, d.deletedAt]))

      const localMap = new Map(localData.memos.map((m) => [m.id, m]))
      const gistMap = new Map(gistData.memos.map((m) => [m.id, m]))
      const allIds = new Set([...localMap.keys(), ...gistMap.keys()])

      const merged = Array.from(allIds).flatMap((id) => {
        const deletedAt = deletedMap.get(id)
        const local = localMap.get(id)
        const gist = gistMap.get(id)
        if (deletedAt && gist && deletedAt >= gist.updatedAt) return []
        if (local && gist) return [local.updatedAt >= gist.updatedAt ? local : gist]
        if (local) return [local]
        return [gist!]
      })

      const hasChange =
        merged.length !== localData.memos.length ||
        merged.some((m) => {
          const local = localMap.get(m.id)
          return !local || local.updatedAt !== m.updatedAt
        })

      if (!hasChange) return
      saveMemoData({ version: MEMO_VERSION, memos: merged })
      reload()
    }).catch(() => {})
  }, [reload])

  // Gist自動保存
  const autoSave = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY) ?? ''
    const gistId = localStorage.getItem(GIST_ID_KEY) ?? ''
    if (!token || !gistId) return
    saveMemoToGist(token, gistId, memoDataRef.current).catch(() => {})
  }, [])

  // 起動・タブ切り替え・30秒ポーリング
  useEffect(() => {
    autoLoad()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        autoLoad()
      } else {
        if (timerRef.current) clearTimeout(timerRef.current)
        autoSave()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    const poll = setInterval(autoLoad, 30000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(poll)
    }
  }, [autoLoad, autoSave])

  // データ変更後3秒で自動保存
  useEffect(() => {
    if (!mounted) return
    memoDataRef.current = loadMemoData()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(autoSave, 3000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [memos, mounted, autoSave])

  const handleAdd = () => {
    if (!content.trim()) return
    const ts = new Date().toISOString()
    const memo: Memo = {
      id: generateId(),
      content: content.trim(),
      characterIds: selectedCharIds,
      sortOrder: getNextMemoSortOrder(),
      createdAt: ts,
      updatedAt: ts,
    }
    saveMemo(memo)
    setContent('')
    setSelectedCharIds([])
    reload()
  }

  const handleEdit = useCallback((updated: Memo) => {
    saveMemo(updated)
    reload()
  }, [reload])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return
    deleteMemo(deleteTarget)
    reload()
    setDeleteTarget(null)
  }, [deleteTarget, reload])

  const handleMoveUp = useCallback((id: string) => {
    const idx = memos.findIndex((m) => m.id === id)
    if (idx <= 0) return
    const ids = memos.map((m) => m.id)
    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
    updateMemoSortOrders(ids)
    reload()
  }, [memos, reload])

  const handleMoveDown = useCallback((id: string) => {
    const idx = memos.findIndex((m) => m.id === id)
    if (idx < 0 || idx >= memos.length - 1) return
    const ids = memos.map((m) => m.id)
    ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
    updateMemoSortOrders(ids)
    reload()
  }, [memos, reload])

  const handleManualSync = async () => {
    const token = localStorage.getItem(TOKEN_KEY) ?? ''
    const gistId = localStorage.getItem(GIST_ID_KEY) ?? ''
    if (!token || !gistId) {
      addToast('キャラクタータブで同期を設定してください', 'warning')
      return
    }
    setSyncing(true)
    try {
      await saveMemoToGist(token, gistId, loadMemoData())
      addToast('メモを同期しました', 'success')
    } catch {
      addToast('同期に失敗しました', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const toggleChar = (id: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen">
      {/* ヒーローバナー */}
      <div className="bg-gradient-to-br from-sky-400 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-3xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sky-100 text-xs font-medium tracking-widest uppercase mb-1">Novel Character Sheet</p>
            <h1 className="text-3xl font-bold tracking-tight">出来事メモ</h1>
            {memos.length > 0 && (
              <p className="text-sky-200 text-sm mt-1">{memos.length}件</p>
            )}
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-4 py-2 text-sm text-white/90 border border-white/40 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {syncing ? '同期中...' : '☁ 同期'}
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {memos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📓</div>
            <p className="text-slate-400 text-sm">まだメモがありません。<br />下のフォームから追加してください。</p>
          </div>
        )}

        {memos.map((memo, index) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            index={index}
            total={memos.length}
            characters={characters}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteTarget(id)}
          />
        ))}

        {/* 入力フォーム */}
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-4 mt-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAdd()
            }}
            placeholder="出来事を記録する..."
            rows={3}
            className="w-full text-sm text-slate-700 leading-relaxed resize-none focus:outline-none placeholder:text-slate-300"
          />

          {characters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-sky-50">
              <span className="text-xs text-slate-400 self-center mr-1">人物タグ</span>
              {characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleChar(c.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedCharIds.includes(c.id)
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-300">Ctrl+Enter で追加</span>
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full disabled:opacity-40 transition-colors shadow-sm"
            >
              追加
            </button>
          </div>
        </div>
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="メモを削除"
        message="このメモを削除します。この操作は取り消せません。"
        confirmLabel="削除する"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDanger
      />
    </div>
  )
}
