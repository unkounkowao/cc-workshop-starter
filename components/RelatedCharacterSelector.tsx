'use client'
import { useState, useEffect, useId } from 'react'
import type { Character } from '@/lib/types'
import { loadCharacters } from '@/lib/storage'

type Props = {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
}

export default function RelatedCharacterSelector({ selectedIds, onChange, label }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const inputId = useId()

  useEffect(() => {
    try {
      setCharacters(loadCharacters())
    } catch {
      setCharacters([])
    }
  }, [])

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  // 選択中IDのうち実際に存在するキャラ
  const selectedCharacters = selectedIds.map((id) => {
    const found = characters.find((c) => c.id === id)
    return { id, name: found ? found.name : '削除されたキャラクター' }
  })

  return (
    <fieldset>
      {label && (
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </legend>
      )}

      {/* 選択済みチップ */}
      {selectedCharacters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3" aria-label="選択中のキャラクター">
          {selectedCharacters.map(({ id, name }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-xs px-2.5 py-1 rounded-full"
            >
              {name}
              <button
                type="button"
                onClick={() => toggle(id)}
                className="ml-0.5 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 rounded-full"
                aria-label={`${name} の選択を解除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 検索インプット */}
      <div className="mb-2">
        <label htmlFor={inputId} className="sr-only">
          キャラクターを検索
        </label>
        <input
          id={inputId}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="名前で絞り込み..."
          className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 placeholder:text-slate-400"
        />
      </div>

      {/* キャラクターリスト */}
      {characters.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">キャラクターがまだ登録されていません。</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">「{searchQuery}」に一致するキャラクターが見つかりません。</p>
      ) : (
        <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
          {filtered.map((c) => {
            const checked = selectedIds.includes(c.id)
            const checkboxId = `char-${c.id}`
            return (
              <label
                key={c.id}
                htmlFor={checkboxId}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-400"
                />
                <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                  {c.name}
                  {c.nameReading && (
                    <span className="ml-1 text-xs text-slate-400">({c.nameReading})</span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}
