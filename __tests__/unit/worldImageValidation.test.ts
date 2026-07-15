import { describe, it, expect } from 'vitest'
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  validateImageFile,
  normalizeMetadataText,
  validateWorldImageMetadata,
  filterAndSearch,
  getUniqueCategories,
} from '@/lib/worldImageValidation'
import { MAX_IMAGE_FILE_SIZE } from '@/lib/constants'
import type { WorldImageMetadata } from '@/lib/types'

const makeMeta = (overrides: Partial<WorldImageMetadata> = {}): WorldImageMetadata => ({
  id: 'test-id',
  fileName: 'test.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024,
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('isAllowedMimeType', () => {
  it('JPEG は許可される', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true)
  })

  it('PNG は許可される', () => {
    expect(isAllowedMimeType('image/png')).toBe(true)
  })

  it('WebP は許可される', () => {
    expect(isAllowedMimeType('image/webp')).toBe(true)
  })

  it('GIF は許可される', () => {
    expect(isAllowedMimeType('image/gif')).toBe(true)
  })

  it('SVG は許可されない', () => {
    expect(isAllowedMimeType('image/svg+xml')).toBe(false)
  })

  it('PDF は許可されない', () => {
    expect(isAllowedMimeType('application/pdf')).toBe(false)
  })

  it('空文字は許可されない', () => {
    expect(isAllowedMimeType('')).toBe(false)
  })
})

describe('isWithinSizeLimit', () => {
  it('上限以下のサイズは許可される', () => {
    expect(isWithinSizeLimit(MAX_IMAGE_FILE_SIZE)).toBe(true)
  })

  it('1バイトは許可される', () => {
    expect(isWithinSizeLimit(1)).toBe(true)
  })

  it('0バイトは許可される', () => {
    expect(isWithinSizeLimit(0)).toBe(true)
  })

  it('上限超過は許可されない', () => {
    expect(isWithinSizeLimit(MAX_IMAGE_FILE_SIZE + 1)).toBe(false)
  })
})

describe('validateImageFile', () => {
  const makeFile = (name: string, type: string, size: number): File => {
    const blob = new Blob(['x'.repeat(size)], { type })
    return new File([blob], name, { type })
  }

  it('正常なJPEGファイルは null を返す', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it('正常なPNGファイルは null を返す', () => {
    const file = makeFile('image.png', 'image/png', 1024)
    expect(validateImageFile(file)).toBeNull()
  })

  it('対応していない形式はエラーメッセージを返す', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const result = validateImageFile(file)
    expect(result).not.toBeNull()
    expect(result).toContain('対応していない形式')
  })

  it('サイズ超過はエラーメッセージを返す', () => {
    const file = makeFile('large.jpg', 'image/jpeg', MAX_IMAGE_FILE_SIZE + 1)
    const result = validateImageFile(file)
    expect(result).not.toBeNull()
    expect(result).toContain('上限')
  })
})

describe('normalizeMetadataText', () => {
  it('undefined はそのまま返す', () => {
    expect(normalizeMetadataText(undefined)).toBeUndefined()
  })

  it('空文字は undefined を返す', () => {
    expect(normalizeMetadataText('')).toBeUndefined()
  })

  it('空白のみは undefined を返す', () => {
    expect(normalizeMetadataText('   ')).toBeUndefined()
  })

  it('前後の空白がトリムされる', () => {
    expect(normalizeMetadataText('  hello  ')).toBe('hello')
  })

  it('通常の文字列はそのまま返す', () => {
    expect(normalizeMetadataText('こんにちは')).toBe('こんにちは')
  })
})

describe('validateWorldImageMetadata', () => {
  it('正常なメタデータは true を返す', () => {
    const meta = makeMeta()
    expect(validateWorldImageMetadata(meta)).toBe(true)
  })

  it('null は false を返す', () => {
    expect(validateWorldImageMetadata(null)).toBe(false)
  })

  it('undefined は false を返す', () => {
    expect(validateWorldImageMetadata(undefined)).toBe(false)
  })

  it('id が欠けていたら false', () => {
    const meta = makeMeta()
    const { id: _id, ...rest } = meta
    expect(validateWorldImageMetadata(rest)).toBe(false)
  })

  it('fileSize が文字列だと false', () => {
    const meta = { ...makeMeta(), fileSize: '1024' }
    expect(validateWorldImageMetadata(meta)).toBe(false)
  })

  it('sortOrder が欠けていたら false', () => {
    const meta = makeMeta()
    const { sortOrder: _so, ...rest } = meta
    expect(validateWorldImageMetadata(rest)).toBe(false)
  })
})

describe('filterAndSearch', () => {
  const images: WorldImageMetadata[] = [
    makeMeta({ id: '1', title: '城の外観', category: '風景', caption: '夕日が美しい' }),
    makeMeta({ id: '2', title: '主人公', category: '人物', fileName: 'hero.jpg' }),
    makeMeta({ id: '3', title: '魔法の杖', category: '道具', sourceNote: '参考書籍' }),
  ]

  it('空の検索・カテゴリーは全件返す', () => {
    expect(filterAndSearch(images, '', '')).toHaveLength(3)
  })

  it('カテゴリーで絞り込める', () => {
    const result = filterAndSearch(images, '', '人物')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('タイトルで検索できる', () => {
    const result = filterAndSearch(images, '城', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('キャプションで検索できる', () => {
    const result = filterAndSearch(images, '夕日', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('ファイル名で検索できる', () => {
    const result = filterAndSearch(images, 'hero', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('sourceNote で検索できる', () => {
    const result = filterAndSearch(images, '参考書籍', '')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('3')
  })

  it('カテゴリー絞り込み + 検索の組み合わせ', () => {
    const result = filterAndSearch(images, '主人公', '人物')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('マッチしない検索は空配列', () => {
    expect(filterAndSearch(images, 'xxxxxxxx', '')).toHaveLength(0)
  })
})

describe('getUniqueCategories', () => {
  it('ユニークなカテゴリーをソートして返す', () => {
    const images = [
      makeMeta({ id: '1', category: '風景' }),
      makeMeta({ id: '2', category: '人物' }),
      makeMeta({ id: '3', category: '風景' }),
      makeMeta({ id: '4', category: '道具' }),
    ]
    const result = getUniqueCategories(images)
    expect(result).toEqual(['人物', '道具', '風景'])
  })

  it('category が undefined のものは無視する', () => {
    const images = [
      makeMeta({ id: '1', category: '風景' }),
      makeMeta({ id: '2', category: undefined }),
    ]
    expect(getUniqueCategories(images)).toEqual(['風景'])
  })

  it('空配列は空配列を返す', () => {
    expect(getUniqueCategories([])).toEqual([])
  })
})
