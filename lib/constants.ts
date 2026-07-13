// LocalStorage キー
export const STORAGE_KEY = 'novel-character-sheet-data'
export const LAST_MODIFIED_KEY = 'novel-character-sheet-modified-at'

// データバージョン
export const DATA_VERSION = 1

// カラーコード正規表現
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

// デフォルトデータ
export const DEFAULT_DATA = {
  version: DATA_VERSION,
  characters: [],
}

// キャラクター項目の定義（ラベルと説明のマッピング）
export const CHARACTER_FIELD_LABELS: Record<string, string> = {
  name: '名前',
  gender: '性別',
  age: '年齢',
  birthday: '誕生日',
  height: '身長',
  imageMotif: 'イメージモチーフ',
  theme: 'テーマ',
  personality: '性格',
  likes: '好きなもの',
  dislikes: '嫌いなもの',
  past: '過去',
  relationshipsAndFamily: '人間関係と家族',
  idealsAndFears: '理想と恐怖',
  actionsInStory: '物語内での行動',
  changeAndEnding: '変化と結末',
  other: 'その他',
}

// 短いテキスト項目（1行入力）
export const SHORT_TEXT_FIELDS = ['name', 'gender', 'age', 'birthday', 'height'] as const

// 長いテキスト項目（複数行入力）
export const LONG_TEXT_FIELDS = [
  'imageMotif',
  'theme',
  'personality',
  'likes',
  'dislikes',
  'past',
  'relationshipsAndFamily',
  'idealsAndFears',
  'actionsInStory',
  'changeAndEnding',
  'other',
] as const
