// キャラクターのイメージカラー
export type ImageColor = {
  id: string
  hex: string
  label?: string
}

// キャラクターデータ
export type Character = {
  id: string
  name: string
  nameReading?: string
  gender?: string
  age?: string
  birthday?: string
  height?: string
  imageColors: ImageColor[]
  imageMotif?: string
  imageSong?: string
  imageSongUrl?: string
  theme?: string
  summary?: string
  personality?: string
  likes?: string
  dislikes?: string
  past?: string
  relationshipsAndFamily?: string
  idealsAndFears?: string
  actionsInStory?: string
  changeAndEnding?: string
  other?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// アプリ全体のデータ構造
export type CharacterSheetData = {
  version: number
  characters: Character[]
}

// インポート時の選択肢
export type ImportMode = 'replace' | 'append'

// トースト通知
export type ToastType = 'success' | 'error' | 'warning'

export type Toast = {
  id: string
  message: string
  type: ToastType
}

// 出来事メモ
export type Memo = {
  id: string
  content: string
  characterIds: string[]
  archived?: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type MemoData = {
  version: number
  memos: Memo[]
}

// 世界観画像メタデータ
export type WorldImageMetadata = {
  id: string
  fileName: string
  mimeType: string
  width?: number
  height?: number
  fileSize: number
  title?: string
  caption?: string
  altText?: string
  category?: string
  sourceNote?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// バックアップ manifest
export type WorldBackupManifest = {
  version: number
  exportedAt: string
  images: Array<{
    id: string
    filePath: string
    fileName: string
    mimeType: string
    fileSize: number
    width?: number
    height?: number
    title?: string
    caption?: string
    category?: string
    sortOrder: number
    createdAt: string
    updatedAt: string
  }>
}

// ===== 年間スケジュール =====

export type StoryMonth = {
  id: string
  name: string
  monthNumber: number // 1-12
}

export type StoryYear = {
  id: string
  name: string
  description?: string
  months: StoryMonth[]
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ScheduleEntryType = 'official' | 'plot'

export type ScheduleEntryStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled'

export type ScheduleEntryImportance = 'low' | 'medium' | 'high'

export type ScheduleEntry = {
  id: string
  yearId: string
  monthId: string
  type: ScheduleEntryType

  title: string
  summary?: string
  details?: string

  dateLabel?: string
  startDay?: number
  endDay?: number
  timeLabel?: string

  category?: string
  location?: string

  relatedCharacterIds: string[]

  // official only
  status?: ScheduleEntryStatus

  importance?: ScheduleEntryImportance

  // plot only
  plotRole?: string
  cause?: string
  result?: string
  foreshadowing?: string
  payoff?: string

  relatedEntryIds: string[]
  relatedWorldImageIds: string[]

  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ScheduleData = {
  version: number
  years: StoryYear[]
  entries: ScheduleEntry[]
}

export type ScheduleBackup = {
  version: number
  exportedAt: string
  years: StoryYear[]
  entries: ScheduleEntry[]
}

export type ScheduleImportMode = 'replace' | 'append'

export type ScheduleImportResult = {
  success: boolean
  yearsImported: number
  entriesImported: number
  yearsSkipped: number
  entriesSkipped: number
  errors: string[]
}
