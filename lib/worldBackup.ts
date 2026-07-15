import JSZip from 'jszip'
import { WORLD_DATA_VERSION, MAX_ZIP_FILES, MAX_ZIP_SIZE } from './constants'
import { generateId } from './utils'
import { isAllowedMimeType, validateWorldImageMetadata } from './worldImageValidation'
import type { WorldBackupManifest, WorldImageMetadata } from './types'

export async function createBackupZip(
  items: Array<{ meta: WorldImageMetadata; blob: Blob }>
): Promise<Blob> {
  const zip = new JSZip()
  const manifestImages: WorldBackupManifest['images'] = []

  for (const { meta, blob } of items) {
    const ext = meta.fileName.split('.').pop() ?? 'bin'
    const filePath = `images/${meta.id}.${ext}`
    zip.file(filePath, blob)
    manifestImages.push({
      id: meta.id,
      filePath,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      fileSize: meta.fileSize,
      width: meta.width,
      height: meta.height,
      title: meta.title,
      caption: meta.caption,
      altText: meta.altText,
      category: meta.category,
      sourceNote: meta.sourceNote,
      sortOrder: meta.sortOrder,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
    })
  }

  const manifest: WorldBackupManifest = {
    version: WORLD_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    images: manifestImages,
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  return zip.generateAsync({ type: 'blob' })
}

export type RestoreItem = {
  meta: Omit<WorldImageMetadata, 'id' | 'sortOrder'> & { id: string; sortOrder: number }
  blob: Blob
}

export type RestoreResult = {
  success: RestoreItem[]
  failed: Array<{ fileName: string; reason: string }>
}

export async function parseBackupZip(
  file: File,
  existingIds: Set<string>
): Promise<RestoreResult> {
  const zip = await JSZip.loadAsync(file)

  // ZIP サイズチェック
  let totalSize = 0
  let fileCount = 0
  zip.forEach(() => { fileCount++ })

  if (fileCount > MAX_ZIP_FILES) {
    throw new Error(`ZIPファイル数が上限（${MAX_ZIP_FILES}）を超えています`)
  }

  // manifest 読み込み
  const manifestFile = zip.file('manifest.json')
  if (!manifestFile) {
    throw new Error('manifest.json が見つかりません')
  }

  const manifestText = await manifestFile.async('text')
  let manifest: unknown
  try {
    manifest = JSON.parse(manifestText)
  } catch {
    throw new Error('manifest.json の形式が不正です')
  }

  if (
    !manifest ||
    typeof manifest !== 'object' ||
    (manifest as WorldBackupManifest).version !== WORLD_DATA_VERSION ||
    !Array.isArray((manifest as WorldBackupManifest).images)
  ) {
    throw new Error('manifest.json のバージョンまたは形式が不正です')
  }

  const m = manifest as WorldBackupManifest
  const success: RestoreItem[] = []
  const failed: Array<{ fileName: string; reason: string }> = []

  for (const entry of m.images) {
    try {
      // パストラバーサル防止
      if (entry.filePath.includes('..') || entry.filePath.startsWith('/')) {
        throw new Error('不正なファイルパスです')
      }

      if (!isAllowedMimeType(entry.mimeType)) {
        throw new Error('対応していない画像形式です')
      }

      const imageFile = zip.file(entry.filePath)
      if (!imageFile) {
        throw new Error('画像ファイルが見つかりません')
      }

      const arrayBuffer = await imageFile.async('arraybuffer')
      totalSize += arrayBuffer.byteLength
      if (totalSize > MAX_ZIP_SIZE) {
        throw new Error('合計サイズが上限を超えています')
      }

      const blob = new Blob([arrayBuffer], { type: entry.mimeType })

      // ID重複処理
      const newId = existingIds.has(entry.id) ? generateId() : entry.id

      const meta: WorldImageMetadata = {
        id: newId,
        fileName: entry.fileName,
        mimeType: entry.mimeType,
        fileSize: entry.fileSize,
        width: entry.width,
        height: entry.height,
        title: entry.title,
        caption: entry.caption,
        altText: entry.altText,
        category: entry.category,
        sourceNote: entry.sourceNote,
        sortOrder: entry.sortOrder,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }

      if (!validateWorldImageMetadata(meta)) {
        throw new Error('メタデータの形式が不正です')
      }

      success.push({ meta, blob })
    } catch (e) {
      failed.push({
        fileName: entry.fileName ?? entry.filePath,
        reason: e instanceof Error ? e.message : '不明なエラー',
      })
    }
  }

  return { success, failed }
}
