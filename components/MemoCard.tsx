'use client'
import { useState } from 'react'
import type { Memo, Character } from '@/lib/types'

type Props = {
  memo: Memo
  index: number
  total: number
  characters: Character[]
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function MemoCard({
  memo,
  index,
  total,
  characters,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(memo.content)
  const [editCharIds, setEditCharIds] = useState<string[]>(memo.characterIds)

  const taggedChars = characters.filter((c) => memo.characterIds.includes(c.id))

  const handleSave = () => {
    onEdit({ ...memo, content: editContent.trim(), characterIds: editCharIds, updatedAt: new Date().toISOString() })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(memo.content)
    setEditCharIds(memo.characterIds)
    setEditing(false)
  }

  const toggleChar = (id: string) => {
    setEditCharIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-sky-200 shadow-sm p-4">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          autoFocus
          className="w-full text-sm text-slate-700 leading-relaxed resize-none focus:outline-none"
        />
        {characters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-sky-50">
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleChar(c.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  editCharIds.includes(c.id)
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleCancelEdit}
            className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!editContent.trim()}
            className="text-xs text-white bg-sky-500 hover:bg-sky-600 px-3 py-1.5 rounded-full disabled:opacity-40 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white rounded-2xl border border-sky-100 shadow-sm p-4 hover:border-sky-200 transition-colors">
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{memo.content}</p>

      {taggedChars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {taggedChars.map((c) => (
            <span
              key={c.id}
              className="text-xs bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-100"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
        <time className="text-xs text-slate-300">{formatDate(memo.createdAt)}</time>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMoveUp(memo.id)}
            disabled={index === 0}
            className="text-xs text-slate-400 hover:text-sky-600 px-1.5 py-1 rounded disabled:opacity-20 transition-colors"
            aria-label="上へ"
          >↑</button>
          <button
            onClick={() => onMoveDown(memo.id)}
            disabled={index === total - 1}
            className="text-xs text-slate-400 hover:text-sky-600 px-1.5 py-1 rounded disabled:opacity-20 transition-colors"
            aria-label="下へ"
          >↓</button>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-slate-400 hover:text-sky-600 px-2 py-1 rounded transition-colors"
          >編集</button>
          <button
            onClick={() => onDelete(memo.id)}
            className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded transition-colors"
          >削除</button>
        </div>
      </div>
    </div>
  )
}
