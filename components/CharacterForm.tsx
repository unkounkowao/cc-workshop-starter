'use client'
import { useState, useCallback, useEffect } from 'react'
import { validateCharacter, isValidHex, normalizeHex } from '@/lib/validation'
import { generateId, now } from '@/lib/utils'
import { CHARACTER_FIELD_LABELS, SHORT_TEXT_FIELDS, LONG_TEXT_FIELDS } from '@/lib/constants'
import { getNextSortOrder } from '@/lib/storage'
import ColorEditor from './ColorEditor'
import type { Character, ImageColor } from '@/lib/types'

type Props = {
  initialCharacter?: Character
  onSave: (character: Character) => void
  onQuickSave?: (character: Character) => void
  onCancel: () => void
}

type FormState = {
  name: string
  gender: string
  age: string
  birthday: string
  height: string
  imageColors: ImageColor[]
  imageMotif: string
  theme: string
  summary: string
  personality: string
  likes: string
  dislikes: string
  past: string
  relationshipsAndFamily: string
  idealsAndFears: string
  actionsInStory: string
  changeAndEnding: string
  other: string
}

function characterToForm(char: Character): FormState {
  return {
    name: char.name ?? '',
    gender: char.gender ?? '',
    age: char.age ?? '',
    birthday: char.birthday ?? '',
    height: char.height ?? '',
    imageColors: char.imageColors ?? [],
    imageMotif: char.imageMotif ?? '',
    theme: char.theme ?? '',
    summary: char.summary ?? '',
    personality: char.personality ?? '',
    likes: char.likes ?? '',
    dislikes: char.dislikes ?? '',
    past: char.past ?? '',
    relationshipsAndFamily: char.relationshipsAndFamily ?? '',
    idealsAndFears: char.idealsAndFears ?? '',
    actionsInStory: char.actionsInStory ?? '',
    changeAndEnding: char.changeAndEnding ?? '',
    other: char.other ?? '',
  }
}

const emptyForm: FormState = {
  name: '',
  gender: '',
  age: '',
  birthday: '',
  height: '',
  imageColors: [],
  imageMotif: '',
  theme: '',
  summary: '',
  personality: '',
  likes: '',
  dislikes: '',
  past: '',
  relationshipsAndFamily: '',
  idealsAndFears: '',
  actionsInStory: '',
  changeAndEnding: '',
  other: '',
}

export default function CharacterForm({ initialCharacter, onSave, onQuickSave, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(
    initialCharacter ? characterToForm(initialCharacter) : emptyForm
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  // 未保存変更の警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const quickSave = useCallback(() => {
    const normalizedColors = form.imageColors.map((c) => ({
      ...c,
      hex: isValidHex(c.hex) ? normalizeHex(c.hex) : c.hex,
    }))
    const candidate: Partial<Character> = { ...form, imageColors: normalizedColors }
    const errs = validateCharacter(candidate)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const ts = now()
    const character: Character = {
      id: initialCharacter?.id ?? generateId(),
      name: form.name.trim(),
      gender: form.gender.trim() || undefined,
      age: form.age.trim() || undefined,
      birthday: form.birthday.trim() || undefined,
      height: form.height.trim() || undefined,
      imageColors: normalizedColors,
      imageMotif: form.imageMotif.trim() || undefined,
      theme: form.theme.trim() || undefined,
      summary: form.summary.trim() || undefined,
      personality: form.personality.trim() || undefined,
      likes: form.likes.trim() || undefined,
      dislikes: form.dislikes.trim() || undefined,
      past: form.past.trim() || undefined,
      relationshipsAndFamily: form.relationshipsAndFamily.trim() || undefined,
      idealsAndFears: form.idealsAndFears.trim() || undefined,
      actionsInStory: form.actionsInStory.trim() || undefined,
      changeAndEnding: form.changeAndEnding.trim() || undefined,
      other: form.other.trim() || undefined,
      sortOrder: initialCharacter?.sortOrder ?? getNextSortOrder(),
      createdAt: initialCharacter?.createdAt ?? ts,
      updatedAt: ts,
    }
    setIsDirty(false)
    if (onQuickSave) {
      onQuickSave(character)
    } else {
      onSave(character)
    }
  }, [form, initialCharacter, onSave, onQuickSave])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        quickSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [quickSave])

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }, [])

  const save = useCallback(
    () => {
      // カラーコードを正規化
      const normalizedColors = form.imageColors.map((c) => ({
        ...c,
        hex: isValidHex(c.hex) ? normalizeHex(c.hex) : c.hex,
      }))

      const candidate: Partial<Character> = {
        ...form,
        imageColors: normalizedColors,
      }

      const errs = validateCharacter(candidate)
      if (Object.keys(errs).length > 0) {
        setErrors(errs)
        return
      }

      const ts = now()
      const character: Character = {
        id: initialCharacter?.id ?? generateId(),
        name: form.name.trim(),
        gender: form.gender.trim() || undefined,
        age: form.age.trim() || undefined,
        birthday: form.birthday.trim() || undefined,
        height: form.height.trim() || undefined,
        imageColors: normalizedColors,
        imageMotif: form.imageMotif.trim() || undefined,
        theme: form.theme.trim() || undefined,
        summary: form.summary.trim() || undefined,
        personality: form.personality.trim() || undefined,
        likes: form.likes.trim() || undefined,
        dislikes: form.dislikes.trim() || undefined,
        past: form.past.trim() || undefined,
        relationshipsAndFamily: form.relationshipsAndFamily.trim() || undefined,
        idealsAndFears: form.idealsAndFears.trim() || undefined,
        actionsInStory: form.actionsInStory.trim() || undefined,
        changeAndEnding: form.changeAndEnding.trim() || undefined,
        other: form.other.trim() || undefined,
        sortOrder: initialCharacter?.sortOrder ?? getNextSortOrder(),
        createdAt: initialCharacter?.createdAt ?? ts,
        updatedAt: ts,
      }

      setIsDirty(false)
      onSave(character)
    },
    [form, initialCharacter, onSave]
  )

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    save()
  }, [save])

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('未保存の変更があります。破棄してもよいですか？')) return
    }
    onCancel()
  }, [isDirty, onCancel])

  const shortFieldLabels = SHORT_TEXT_FIELDS.filter((f) => f !== 'name')

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 操作ボタン（上部） */}
      <div className="flex items-center justify-between gap-3 mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {initialCharacter ? 'キャラクターを編集' : '新規キャラクター'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors min-h-[44px]"
          >
            保存
          </button>
        </div>
      </div>

      {/* 基本情報 */}
      <fieldset className="mb-8">
        <legend className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          基本情報
        </legend>

        {/* 名前（必須） */}
        <div className="mb-4">
          <label
            htmlFor="field-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {CHARACTER_FIELD_LABELS.name}
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="field-name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        {/* 短いテキスト項目 2列グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortFieldLabels.map((field) => (
            <div key={field}>
              <label
                htmlFor={`field-${field}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {CHARACTER_FIELD_LABELS[field]}
              </label>
              <input
                id={`field-${field}`}
                type="text"
                value={form[field] as string}
                onChange={(e) => update(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* イメージカラー */}
      <fieldset className="mb-8">
        <legend className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          イメージカラー
        </legend>
        <ColorEditor
          colors={form.imageColors}
          onChange={(colors) => update('imageColors', colors)}
        />
        {/* カラーエラー表示 */}
        {Object.entries(errors)
          .filter(([k]) => k.startsWith('imageColors.'))
          .map(([k, v]) => (
            <p key={k} className="mt-1 text-sm text-red-500">
              {v}
            </p>
          ))}
      </fieldset>

      {/* キャラクター設定 */}
      <fieldset className="mb-8">
        <legend className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          キャラクター設定
        </legend>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {LONG_TEXT_FIELDS.map((field) => (
            <div
              key={field}
              className={
                ['past', 'relationshipsAndFamily', 'actionsInStory', 'changeAndEnding', 'other'].includes(field)
                  ? 'lg:col-span-2'
                  : ''
              }
            >
              <label
                htmlFor={`field-${field}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {CHARACTER_FIELD_LABELS[field]}
              </label>
              <textarea
                id={`field-${field}`}
                value={form[field] as string}
                onChange={(e) => update(field, e.target.value)}
                rows={field === 'imageMotif' ? 2 : 4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* 操作ボタン（下部） */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors min-h-[44px]"
        >
          保存
        </button>
      </div>
    </form>
  )
}
