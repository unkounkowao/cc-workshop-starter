// LocalStorage キー
export const STORAGE_KEY = 'novel-character-sheet-data'
export const LAST_MODIFIED_KEY = 'novel-character-sheet-modified-at'
export const DELETED_IDS_KEY = 'novel-character-sheet-deleted-ids'

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
  nameReading: '読み方',
  gender: '性別',
  age: '年齢',
  birthday: '誕生日',
  height: '身長',
  imageMotif: 'イメージモチーフ',
  imageSong: 'イメソン',
  imageSongUrl: 'イメソン リンク',
  theme: 'テーマ',
  summary: '概要',
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
export const SHORT_TEXT_FIELDS = ['name', 'nameReading', 'gender', 'age', 'birthday', 'height'] as const

// 長いテキスト項目（複数行入力）
export const LONG_TEXT_FIELDS = [
  'imageMotif',
  'theme',
  'summary',
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

// 世界観ギャラリー用定数
export const WORLD_DB_NAME = 'novel-world-gallery'
export const WORLD_DB_VERSION = 1
export const WORLD_IMAGES_STORE = 'world-images'
export const WORLD_BLOBS_STORE = 'world-blobs'
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const WORLD_DATA_VERSION = 1
export const MAX_ZIP_FILES = 500
export const MAX_ZIP_SIZE = 500 * 1024 * 1024 // 500MB
