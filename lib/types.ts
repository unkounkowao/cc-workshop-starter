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
  gender?: string
  age?: string
  birthday?: string
  height?: string
  imageColors: ImageColor[]
  imageMotif?: string
  theme?: string
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
