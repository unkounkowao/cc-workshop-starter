import React from 'react'
import { isEmpty, isEmptyColorArray } from '@/lib/validation'
import { CHARACTER_FIELD_LABELS, LONG_TEXT_FIELDS } from '@/lib/constants'
import ColorChip from './ColorChip'
import type { Character } from '@/lib/types'

type Props = {
  character: Character
}

// 空白行を狭い段落間隔で表現する
function FieldText({ value }: { value: string }) {
  const paragraphs = value.split(/\n\n+/)
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {para}
        </p>
      ))}
    </div>
  )
}

export default function CharacterDetail({ character }: Props) {
  return (
    <div>
      {/* 基本情報 */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-sky-700 uppercase tracking-widest mb-4">
          基本情報
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(['gender', 'age', 'birthday', 'height'] as const).map((field) => {
            const value = character[field]
            if (isEmpty(value)) return null
            return (
              <div key={field}>
                <dt className="text-xs text-slate-400 mb-0.5">
                  {CHARACTER_FIELD_LABELS[field]}
                </dt>
                <dd className="text-sm text-slate-800 font-medium">{value}</dd>
              </div>
            )
          })}
        </div>
      </section>

      {/* イメージカラー */}
      {!isEmptyColorArray(character.imageColors) && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-sky-700 uppercase tracking-widest mb-4">
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
          <h2 className="text-xs font-semibold text-sky-700 uppercase tracking-widest mb-4">
            キャラクター設定
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {LONG_TEXT_FIELDS.map((field) => {
              const value = character[field]
              const isLong = ['past', 'relationshipsAndFamily', 'actionsInStory', 'changeAndEnding', 'other'].includes(field)

              // imageMotif はイメソンとセットで扱う
              if (field === 'imageMotif') {
                if (isEmpty(value) && isEmpty(character.imageSong)) return null
                return (
                  <React.Fragment key={field}>
                    {!isEmpty(value) && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">
                          {CHARACTER_FIELD_LABELS[field]}
                        </h3>
                        <FieldText value={value as string} />
                      </div>
                    )}
                    {!isEmpty(character.imageSong) && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">
                          {CHARACTER_FIELD_LABELS.imageSong}
                        </h3>
                        {character.imageSongUrl ? (
                          <a
                            href={character.imageSongUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-sky-700 underline underline-offset-2 hover:text-sky-900"
                          >
                            {character.imageSong}
                            <span className="text-xs">↗</span>
                          </a>
                        ) : (
                          <p className="text-sm text-slate-700">{character.imageSong}</p>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )
              }

              if (isEmpty(value)) return null
              return (
                <div key={field} className={isLong ? 'lg:col-span-2' : ''}>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">
                    {CHARACTER_FIELD_LABELS[field]}
                  </h3>
                  <FieldText value={value as string} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
