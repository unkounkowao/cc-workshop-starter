'use client'
import Link from 'next/link'
import type { Character } from '@/lib/types'
import ColorChip from './ColorChip'

type Props = {
  character: Character
  index: number
  total: number
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export default function CharacterCard({
  character,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: Props) {
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-sky-100">
      {/* メインリンク */}
      <Link
        href={`/character?id=${character.id}`}
        className="block p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-t-2xl flex-1"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors text-base leading-tight">
              {character.name}
            </h3>
            {character.nameReading && (
              <p className="text-xs text-slate-400 mt-0.5">{character.nameReading}</p>
            )}
          </div>
          {character.imageColors.length > 0 && (
            <div className="flex gap-1 shrink-0 mt-0.5">
              {character.imageColors.slice(0, 4).map((color) => (
                <ColorChip key={color.id} color={color} size="sm" />
              ))}
            </div>
          )}
        </div>
        {character.theme && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {character.theme}
          </p>
        )}
      </Link>

      {/* 並び替えボタン */}
      <div className="flex border-t border-sky-50 bg-sky-50/60">
        <button
          onClick={() => onMoveUp(character.id)}
          disabled={index === 0}
          className="flex-1 py-2 text-xs text-slate-400 hover:text-sky-600 hover:bg-sky-100/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
          aria-label={`${character.name} を上に移動`}
        >
          ↑ 上へ
        </button>
        <div className="w-px bg-sky-100" />
        <button
          onClick={() => onMoveDown(character.id)}
          disabled={index === total - 1}
          className="flex-1 py-2 text-xs text-slate-400 hover:text-sky-600 hover:bg-sky-100/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
          aria-label={`${character.name} を下に移動`}
        >
          ↓ 下へ
        </button>
      </div>
    </div>
  )
}
