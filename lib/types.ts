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
    altText?: string
    category?: string
    sourceNote?: string
    sortOrder: number
    createdAt: string
    updatedAt: string
  }>
}
