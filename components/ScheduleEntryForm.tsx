'use client'
import React, { useState, useCallback, useEffect, useId } from 'react'
import type { ScheduleEntry, ScheduleEntryType, StoryYear } from '@/lib/types'
import { generateId, now } from '@/lib/utils'
import {
  validateScheduleEntry,
  normalizeString,
  parseOptionalDay,
} from '@/lib/scheduleValidation'
import type { ScheduleEntryErrors } from '@/lib/scheduleValidation'
import {
  SCHEDULE_ENTRY_TYPE_LABELS,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_IMPORTANCE_LABELS,
  PLOT_ROLE_SUGGESTIONS,
} from '@/lib/constants'
import RelatedCharacterSelector from './RelatedCharacterSelector'
import RelatedEntrySelector from './RelatedEntrySelector'

type Props = {
  type: ScheduleEntryType
  initialEntry?: ScheduleEntry
  years: StoryYear[]
  defaultYearId?: string
  defaultMonthId?: string
  onSave: (entry: ScheduleEntry) => void
  onCancel: () => void
}

type FormState = {
  title: string
  yearId: string
  monthId: string
  dateLabel: string
  startDay: string
  endDay: string
  timeLabel: string
  summary: string
  details: string
  category: string
  location: string
  importance: string
  status: string
  plotRole: string
  cause: string
  result: string
  foreshadowing: string
  payoff: string
  relatedCharacterIds: string[]
  relatedEntryIds: string[]
}

function entryToForm(entry: ScheduleEntry): FormState {
  return {
    title: entry.title,
    yearId: entry.yearId,
    monthId: entry.monthId,
    dateLabel: entry.dateLabel ?? '',
    startDay: entry.startDay !== undefined ? String(entry.startDay) : '',
    endDay: entry.endDay !== undefined ? String(entry.endDay) : '',
    timeLabel: entry.timeLabel ?? '',
    summary: entry.summary ?? '',
    details: entry.details ?? '',
    category: entry.category ?? '',
    location: entry.location ?? '',
    importance: entry.importance ?? '',
    status: entry.status ?? '',
    plotRole: entry.plotRole ?? '',
    cause: entry.cause ?? '',
    result: entry.result ?? '',
    foreshadowing: entry.foreshadowing ?? '',
    payoff: entry.payoff ?? '',
    relatedCharacterIds: entry.relatedCharacterIds ?? [],
    relatedEntryIds: entry.relatedEntryIds ?? [],
  }
}

function makeEmptyForm(
  type: ScheduleEntryType,
  defaultYearId?: string,
  defaultMonthId?: string
): FormState {
  return {
    title: '',
    yearId: defaultYearId ?? '',
    monthId: defaultMonthId ?? '',
    dateLabel: '',
    startDay: '',
    endDay: '',
    timeLabel: '',
    summary: '',
    details: '',
    category: '',
    location: '',
    importance: '',
    status: type === 'official' ? 'planned' : '',
    plotRole: '',
    cause: '',
    result: '',
    foreshadowing: '',
    payoff: '',
    relatedCharacterIds: [],
    relatedEntryIds: [],
  }
}

// フィールドラベルコンポーネント
function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-700 mb-1"
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500 text-xs" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}

// インラインエラーメッセージ
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  )
}

// テキスト入力の共通スタイル
const inputClass =
  'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 placeholder:text-slate-400 transition-colors'
const inputErrorClass =
  'w-full text-sm border border-red-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 placeholder:text-slate-400 transition-colors'
const textareaClass =
  'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 placeholder:text-slate-400 resize-y min-h-[80px] transition-colors'
const selectClass =
  'w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white transition-colors'
const selectErrorClass =
  'w-full text-sm border border-red-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-white transition-colors'

export default function ScheduleEntryForm({
  type,
  initialEntry,
  years,
  defaultYearId,
  defaultMonthId,
  onSave,
  onCancel,
}: Props) {
  const [form, setForm] = useState<FormState>(
    initialEntry
      ? entryToForm(initialEntry)
      : makeEmptyForm(type, defaultYearId, defaultMonthId)
  )
  const [errors, setErrors] = useState<ScheduleEntryErrors>({})
  const [isDirty, setIsDirty] = useState(false)
  const plotRoleListId = useId()

  const isOfficial = type === 'official'
  const isEditing = !!initialEntry

  // 選択中の年オブジェクト
  const selectedYear = years.find((y) => y.id === form.yearId) ?? null

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

  // フォームフィールド更新ヘルパー
  const update = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setIsDirty(true)
      // フィールドのエラーをクリア
      if (errors[key as string]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[key as string]
          return next
        })
      }
    },
    [errors]
  )

  // 年変更時は月をリセット
  const handleYearChange = useCallback(
    (yearId: string) => {
      setForm((prev) => ({ ...prev, yearId, monthId: '', relatedEntryIds: [] }))
      setIsDirty(true)
    },
    []
  )

  // エントリを組み立てる共通処理
  const buildEntry = useCallback((): ScheduleEntry | null => {
    const candidate: Partial<ScheduleEntry> = {
      id: initialEntry?.id ?? generateId(),
      type,
      yearId: form.yearId,
      monthId: form.monthId,
      title: form.title,
      relatedCharacterIds: form.relatedCharacterIds,
      relatedEntryIds: form.relatedEntryIds,
    }
    const errs = validateScheduleEntry(candidate)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return null
    }

    const ts = now()
    const entry: ScheduleEntry = {
      id: initialEntry?.id ?? generateId(),
      type,
      yearId: form.yearId,
      monthId: form.monthId,
      title: form.title.trim(),
      summary: normalizeString(form.summary),
      details: normalizeString(form.details),
      dateLabel: normalizeString(form.dateLabel),
      startDay: parseOptionalDay(form.startDay),
      endDay: parseOptionalDay(form.endDay),
      timeLabel: normalizeString(form.timeLabel),
      category: normalizeString(form.category),
      location: normalizeString(form.location),
      importance: form.importance !== ''
        ? (form.importance as ScheduleEntry['importance'])
        : undefined,
      status: isOfficial && form.status !== ''
        ? (form.status as ScheduleEntry['status'])
        : undefined,
      plotRole: !isOfficial ? normalizeString(form.plotRole) : undefined,
      cause: !isOfficial ? normalizeString(form.cause) : undefined,
      result: !isOfficial ? normalizeString(form.result) : undefined,
      foreshadowing: !isOfficial ? normalizeString(form.foreshadowing) : undefined,
      payoff: !isOfficial ? normalizeString(form.payoff) : undefined,
      relatedCharacterIds: form.relatedCharacterIds,
      relatedEntryIds: form.relatedEntryIds,
      relatedWorldImageIds: initialEntry?.relatedWorldImageIds ?? [],
      sortOrder: initialEntry?.sortOrder ?? 0,
      createdAt: initialEntry?.createdAt ?? ts,
      updatedAt: ts,
    }
    return entry
  }, [form, initialEntry, type, isOfficial])

  // 保存（詳細ページへ遷移）
  const handleSave = useCallback(() => {
    const entry = buildEntry()
    if (!entry) return
    setIsDirty(false)
    onSave(entry)
  }, [buildEntry, onSave])

  // Ctrl+S クイックセーブ
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  const typeLabel = SCHEDULE_ENTRY_TYPE_LABELS[type]
  const formTitle = isEditing ? `${typeLabel}を編集` : `${typeLabel}を追加`

  return (
    <div className="flex flex-col min-h-full">
      {/* スティッキーヘッダー */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 truncate">{formTitle}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-sm text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            保存
          </button>
        </div>
      </div>

      {/* フォーム本体 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ---- 基本情報セクション ---- */}
        <section aria-labelledby="section-basic">
          <h3 id="section-basic" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
            基本情報
          </h3>
          <div className="space-y-4">
            {/* タイトル */}
            <TitleField
              value={form.title}
              error={errors.title}
              onChange={(v) => update('title', v)}
            />

            {/* 年・月 (2カラム) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <YearField
                years={years}
                value={form.yearId}
                error={errors.yearId}
                onChange={handleYearChange}
              />
              <MonthField
                year={selectedYear}
                value={form.monthId}
                error={errors.monthId}
                onChange={(v) => update('monthId', v)}
              />
            </div>
          </div>
        </section>

        {/* ---- 日時セクション ---- */}
        <section aria-labelledby="section-date">
          <h3 id="section-date" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
            日時
          </h3>
          <div className="space-y-4">
            {/* 日付ラベル */}
            <div>
              <FieldLabel htmlFor="field-dateLabel">日付ラベル</FieldLabel>
              <input
                id="field-dateLabel"
                type="text"
                value={form.dateLabel}
                onChange={(e) => update('dateLabel', e.target.value)}
                placeholder="例：満月の夜、春の終わり"
                className={inputClass}
              />
            </div>

            {/* 開始日・終了日 (2カラム) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="field-startDay">開始日</FieldLabel>
                <input
                  id="field-startDay"
                  type="number"
                  min={1}
                  max={31}
                  value={form.startDay}
                  onChange={(e) => update('startDay', e.target.value)}
                  placeholder="1〜31"
                  className={errors.dateRange ? inputErrorClass : inputClass}
                  aria-describedby={errors.dateRange ? 'dateRange-error' : undefined}
                />
              </div>
              <div>
                <FieldLabel htmlFor="field-endDay">終了日</FieldLabel>
                <input
                  id="field-endDay"
                  type="number"
                  min={1}
                  max={31}
                  value={form.endDay}
                  onChange={(e) => update('endDay', e.target.value)}
                  placeholder="1〜31"
                  className={errors.dateRange ? inputErrorClass : inputClass}
                  aria-describedby={errors.dateRange ? 'dateRange-error' : undefined}
                />
              </div>
            </div>
            {errors.dateRange && (
              <p id="dateRange-error" className="text-xs text-red-600" role="alert">
                {errors.dateRange}
              </p>
            )}

            {/* 時間ラベル */}
            <div>
              <FieldLabel htmlFor="field-timeLabel">時間ラベル</FieldLabel>
              <input
                id="field-timeLabel"
                type="text"
                value={form.timeLabel}
                onChange={(e) => update('timeLabel', e.target.value)}
                placeholder="例：夕暮れ、深夜"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ---- 内容セクション ---- */}
        <section aria-labelledby="section-content">
          <h3 id="section-content" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
            内容
          </h3>
          <div className="space-y-4">
            {/* 概要 */}
            <div>
              <FieldLabel htmlFor="field-summary">概要</FieldLabel>
              <textarea
                id="field-summary"
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                placeholder="イベントの簡単な説明"
                className={textareaClass}
                rows={3}
              />
            </div>

            {/* 詳細 */}
            <div>
              <FieldLabel htmlFor="field-details">詳細</FieldLabel>
              <textarea
                id="field-details"
                value={form.details}
                onChange={(e) => update('details', e.target.value)}
                placeholder="詳しい内容・描写など"
                className={textareaClass}
                rows={5}
              />
            </div>
          </div>
        </section>

        {/* ---- 分類セクション ---- */}
        <section aria-labelledby="section-classify">
          <h3 id="section-classify" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
            分類・場所
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* カテゴリ */}
            <div>
              <FieldLabel htmlFor="field-category">カテゴリ</FieldLabel>
              <input
                id="field-category"
                type="text"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="例：戦闘、日常、祭り"
                className={inputClass}
              />
            </div>

            {/* 場所 */}
            <div>
              <FieldLabel htmlFor="field-location">場所</FieldLabel>
              <input
                id="field-location"
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="例：王都、森の奥"
                className={inputClass}
              />
            </div>

            {/* 重要度 */}
            <div>
              <FieldLabel htmlFor="field-importance">重要度</FieldLabel>
              <select
                id="field-importance"
                value={form.importance}
                onChange={(e) => update('importance', e.target.value)}
                className={selectClass}
              >
                <option value="">未設定</option>
                {Object.entries(SCHEDULE_IMPORTANCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* ステータス（official のみ） */}
            {isOfficial && (
              <div>
                <FieldLabel htmlFor="field-status">ステータス</FieldLabel>
                <select
                  id="field-status"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={selectClass}
                >
                  <option value="">未設定</option>
                  {Object.entries(SCHEDULE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* ---- プロット情報セクション（plot のみ） ---- */}
        {!isOfficial && (
          <section aria-labelledby="section-plot">
            <h3 id="section-plot" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
              プロット情報
            </h3>
            <div className="space-y-4">
              {/* プロット役割 */}
              <div>
                <FieldLabel htmlFor="field-plotRole">プロット役割</FieldLabel>
                <input
                  id="field-plotRole"
                  type="text"
                  list={plotRoleListId}
                  value={form.plotRole}
                  onChange={(e) => update('plotRole', e.target.value)}
                  placeholder="例：転換点、伏線"
                  className={inputClass}
                />
                <datalist id={plotRoleListId}>
                  {PLOT_ROLE_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* 原因・きっかけ */}
              <div>
                <FieldLabel htmlFor="field-cause">原因・きっかけ</FieldLabel>
                <textarea
                  id="field-cause"
                  value={form.cause}
                  onChange={(e) => update('cause', e.target.value)}
                  placeholder="このイベントが起こった原因"
                  className={textareaClass}
                  rows={3}
                />
              </div>

              {/* 結果・影響 */}
              <div>
                <FieldLabel htmlFor="field-result">結果・影響</FieldLabel>
                <textarea
                  id="field-result"
                  value={form.result}
                  onChange={(e) => update('result', e.target.value)}
                  placeholder="このイベントが及ぼした結果や影響"
                  className={textareaClass}
                  rows={3}
                />
              </div>

              {/* 伏線・予兆 */}
              <div>
                <FieldLabel htmlFor="field-foreshadowing">伏線・予兆</FieldLabel>
                <textarea
                  id="field-foreshadowing"
                  value={form.foreshadowing}
                  onChange={(e) => update('foreshadowing', e.target.value)}
                  placeholder="この出来事に関連する伏線"
                  className={textareaClass}
                  rows={3}
                />
              </div>

              {/* 伏線回収 */}
              <div>
                <FieldLabel htmlFor="field-payoff">伏線回収</FieldLabel>
                <textarea
                  id="field-payoff"
                  value={form.payoff}
                  onChange={(e) => update('payoff', e.target.value)}
                  placeholder="回収される伏線の内容"
                  className={textareaClass}
                  rows={3}
                />
              </div>
            </div>
          </section>
        )}

        {/* ---- 関連セクション ---- */}
        <section aria-labelledby="section-relations">
          <h3 id="section-relations" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 border-b border-slate-100 pb-1">
            関連情報
          </h3>
          <div className="space-y-6">
            {/* 関連キャラクター */}
            <RelatedCharacterSelector
              selectedIds={form.relatedCharacterIds}
              onChange={(ids) => update('relatedCharacterIds', ids)}
              label="関連キャラクター"
            />

            {/* 関連項目（年が選択されている場合のみ） */}
            {form.yearId && (
              <div>
                {errors.relatedEntryIds && (
                  <p className="mb-1 text-xs text-red-600" role="alert">
                    {errors.relatedEntryIds}
                  </p>
                )}
                <RelatedEntrySelector
                  currentEntryId={initialEntry?.id}
                  yearId={form.yearId}
                  selectedIds={form.relatedEntryIds}
                  onChange={(ids) => update('relatedEntryIds', ids)}
                  label="関連項目"
                />
              </div>
            )}
          </div>
        </section>

        {/* 保存ボタン（下部にも配置） */}
        <div className="flex justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- 分割コンポーネント ----

function TitleField({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel htmlFor="field-title" required>
        タイトル
      </FieldLabel>
      <input
        id="field-title"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="イベント名・出来事の名称"
        className={error ? inputErrorClass : inputClass}
        aria-required="true"
        aria-describedby={error ? 'title-error' : undefined}
      />
      {error && (
        <p id="title-error" className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function YearField({
  years,
  value,
  error,
  onChange,
}: {
  years: StoryYear[]
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel htmlFor="field-yearId" required>
        年
      </FieldLabel>
      <select
        id="field-yearId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? selectErrorClass : selectClass}
        aria-required="true"
        aria-describedby={error ? 'yearId-error' : undefined}
      >
        <option value="">年を選択...</option>
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.name}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  )
}

function MonthField({
  year,
  value,
  error,
  onChange,
}: {
  year: StoryYear | null
  value: string
  error?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel htmlFor="field-monthId" required>
        月
      </FieldLabel>
      <select
        id="field-monthId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!year}
        className={error ? selectErrorClass : selectClass}
        aria-required="true"
        aria-describedby={error ? 'monthId-error' : undefined}
      >
        <option value="">月を選択...</option>
        {year?.months.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      {!year && (
        <p className="mt-1 text-xs text-slate-400">先に年を選択してください。</p>
      )}
      <FieldError message={error} />
    </div>
  )
}
