import React from 'react'
import { isEmpty, isEmptyColorArray } from '@/lib/validation'
import { CHARACTER_FIELD_LABELS, LONG_TEXT_FIELDS } from '@/lib/constants'
import ColorChip from './ColorChip'
import type { Character } from '@/lib/types'

type Props = {
  character: Character
}

export default function CharacterDetail({ character }: Props) {
  return (
    <div>
      {/* 基本情報 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          基本情報
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(['gender', 'age', 'birthday', 'height'] as const).map((field) => {
            const value = character[field]
            if (isEmpty(value)) return null
            return (
              <div key={field}>
                <dt className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  {CHARACTER_FIELD_LABELS[field]}
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 font-medium">{value}</dd>
              </div>
            )
          })}
        </div>
      </section>

      {/* イメージカラー */}
      {!isEmptyColorArray(character.imageColors) && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            イメージカラー
          </h2>
          <div className="flex flex-wrap gap-3">
            {character.imageColors.map((color) => (
              <ColorChip key={color.id} color={color} size="md" />
            ))}
          </div>
        </section>
      )}

      {/* キャラクター設定 */}
      {(LONG_TEXT_FIELDS.some((field) => !isEmpty(character[field])) || !isEmpty(character.imageSong)) && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            キャラクター設定
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {LONG_TEXT_FIELDS.map((field) => {
              const value = character[field]
              if (isEmpty(value)) return null
              const isLong = ['past', 'relationshipsAndFamily', 'actionsInStory', 'changeAndEnding', 'other'].includes(field)
              return (
                <div key={field} className={isLong ? 'lg:col-span-2' : ''}>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {CHARACTER_FIELD_LABELS[field]}
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {value}
                  </p>
                </div>
              )
            })}
            {!isEmpty(character.imageSong) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {CHARACTER_FIELD_LABELS.imageSong}
                </h3>
                {character.imageSongUrl ? (
                  <a
                    href={character.imageSongUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {character.imageSong}
                    <span className="text-xs">↗</span>
                  </a>
                ) : (
                  <p className="text-sm text-gray-900 dark:text-gray-100">{character.imageSong}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
