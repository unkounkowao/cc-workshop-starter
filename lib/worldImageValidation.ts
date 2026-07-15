import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from './constants'
import type { WorldImageMetadata } from './types'

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)
}

export function isWithinSizeLimit(fileSize: number): boolean {
  return fileSize <= MAX_IMAGE_FILE_SIZE
}

export function validateImageFile(file: File): string | null {
  if (!isAllowedMimeType(file.type)) {
    return `「${file.name}」は対応していない形式です（JPEG/PNG/WebP/GIF のみ）`
  }
  if (!isWithinSizeLimit(file.size)) {
    return `「${file.name}」はファイルサイズが上限（10MB）を超えています`
  }
  return null
}

export function normalizeMetadataText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function validateWorldImageMetadata(data: unknown): data is WorldImageMetadata {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.id === 'string' &&
    typeof d.fileName === 'string' &&
    typeof d.mimeType === 'string' &&
    typeof d.fileSize === 'number' &&
    typeof d.sortOrder === 'number' &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string'
  )
}

export function filterAndSearch(
  images: WorldImageMetadata[],
  query: string,
  category: string
): WorldImageMetadata[] {
  let result = images
  if (category) {
    result = result.filter((img) => img.category === category)
  }
  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(
      (img) =>
        img.title?.toLowerCase().includes(q) ||
        img.caption?.toLowerCase().includes(q) ||
        img.category?.toLowerCase().includes(q) ||
        img.sourceNote?.toLowerCase().includes(q) ||
        img.fileName.toLowerCase().includes(q)
    )
  }
  return result
}

export function getUniqueCategories(images: WorldImageMetadata[]): string[] {
  const cats = new Set<string>()
  for (const img of images) {
    if (img.category) cats.add(img.category)
  }
  return Array.from(cats).sort()
}
