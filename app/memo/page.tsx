'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  loadMemos,
  saveMemo,
  deleteMemo,
  archiveMemo,
  updateMemoSortOrders,
  getNextMemoSortOrder,
} from '@/lib/memoStorage'
import { loadCharacters } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { Memo, Character, Toast as ToastType } from '@/lib/types'
import MemoCard from '@/components/MemoCard'
import Toast from '@/components/Toast'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function MemoPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'main' | 'archive'>('main')
  const [content, setContent] = useState('')
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastType[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const reload = useCallback(() => {
    setMemos(loadMemos())
  }, [])

  useEffect(() => {
    setMounted(true)
    reload()
    setCharacters(loadCharacters())
    // GistSyncからの同期通知を受け取る
    const onSync = () => reload()
    window.addEventListener('gist-synced', onSync)
    return () => window.removeEventListener('gist-synced', onSync)
  }, [reload])

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

  const handleArchive = useCallback((id: string, archived: boolean) => {
    archiveMemo(id, archived)
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

  const toggleChar = (id: string) => {
    setSelectedCharIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (!mounted) return null

  const mainMemos = memos.filter((m) => !m.archived)
  const archiveMemos = memos
    .filter((m) => m.archived)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return (
    <div className="min-h-screen">
      {/* ヒーローバナー */}
      <div className="bg-gradient-to-br from-sky-400 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-sky-100 text-xs font-medium tracking-widest uppercase mb-1">Novel Character Sheet</p>
          <h1 className="text-3xl font-bold tracking-tight">メモ</h1>
        </div>
      </div>

      {/* タブ */}
      <div className="max-w-3xl mx-auto px-4 pt-3 flex gap-2">
        <button
          onClick={() => setTab('main')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === 'main' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
          }`}
        >
          メモ
        </button>
        <button
          onClick={() => setTab('archive')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === 'archive' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
          }`}
        >
          アーカイブ
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-48 space-y-2">
        {tab === 'main' ? (
          mainMemos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">📓</div>
              <p className="text-slate-400 text-sm">まだメモがありません。<br />下のフォームから追加してください。</p>
            </div>
          ) : (
            mainMemos.map((memo, index) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                index={index}
                total={mainMemos.length}
                characters={characters}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteTarget(id)}
                onArchive={handleArchive}
              />
            ))
          )
        ) : (
          archiveMemos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">🗃️</div>
              <p className="text-slate-400 text-sm">アーカイブされたメモはありません。</p>
            </div>
          ) : (
            archiveMemos.map((memo, index) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                index={index}
                total={archiveMemos.length}
                characters={characters}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteTarget(id)}
                onArchive={handleArchive}
              />
            ))
          )
        )}
      </main>

      {/* 入力フォーム（固定・メインタブのみ） */}
      {tab === 'main' && (
        <div className="sticky bottom-0 bg-white border-t border-sky-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleAdd()
              }}
              placeholder="出来事を記録する..."
              rows={2}
              className="w-full text-sm text-slate-700 leading-relaxed resize-y focus:outline-none placeholder:text-slate-300"
            />

            {characters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-sky-50">
                <span className="text-xs text-slate-400 self-center mr-1">人物タグ</span>
                {characters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChar(c.id)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
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

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-300">Ctrl+Enter で追加</span>
              <button
                onClick={handleAdd}
                disabled={!content.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-full disabled:opacity-40 transition-colors shadow-sm"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

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
