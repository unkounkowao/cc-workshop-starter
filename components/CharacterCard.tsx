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
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* メインリンク */}
      <Link
        href={`/character?id=${character.id}`}
        className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl flex-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {character.name}
            </h3>
            {character.theme && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {character.theme}
              </p>
            )}
          </div>
          {/* カラーチップ */}
          {character.imageColors.length > 0 && (
            <div className="flex gap-1 shrink-0">
              {character.imageColors.slice(0, 4).map((color) => (
                <ColorChip key={color.id} color={color} size="sm" />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* 並び替えボタン */}
      <div className="flex border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => onMoveUp(character.id)}
          disabled={index === 0}
          className="flex-1 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          aria-label={`${character.name} を上に移動`}
        >
          ↑ 上へ
        </button>
        <div className="w-px bg-gray-100 dark:bg-gray-800" />
        <button
          onClick={() => onMoveDown(character.id)}
          disabled={index === total - 1}
          className="flex-1 py-2 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          aria-label={`${character.name} を下に移動`}
        >
          ↓ 下へ
        </button>
      </div>
    </div>
  )
}
