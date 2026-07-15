import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { openDB } from 'idb'
import {
  WORLD_IMAGES_STORE,
  WORLD_BLOBS_STORE,
} from '@/lib/constants'
import { generateId, now } from '@/lib/utils'
import type { WorldImageMetadata } from '@/lib/types'

// テスト用のDB操作ヘルパー（各テストで独立したDB名を使用）
function createTestDB(dbName: string) {
  let dbPromise: ReturnType<typeof openDB> | null = null

  function getTestDB() {
    if (!dbPromise) {
      dbPromise = openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(WORLD_IMAGES_STORE)) {
            db.createObjectStore(WORLD_IMAGES_STORE, { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains(WORLD_BLOBS_STORE)) {
            db.createObjectStore(WORLD_BLOBS_STORE, { keyPath: 'id' })
          }
        },
      })
    }
    return dbPromise
  }

  async function saveImage(
    metadata: { fileName: string; mimeType: string; fileSize: number; title?: string; category?: string; [key: string]: unknown },
    blob: Blob
  ): Promise<WorldImageMetadata> {
    const db = await getTestDB()
    const ts = now()
    const all = await db.getAll(WORLD_IMAGES_STORE)
    const maxOrder = all.length > 0
      ? Math.max(...(all as WorldImageMetadata[]).map((m) => m.sortOrder))
      : -1

    const meta: WorldImageMetadata = {
      id: generateId(),
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      fileSize: metadata.fileSize,
      width: undefined,
      height: undefined,
      title: metadata.title as string | undefined,
      caption: undefined,
      altText: undefined,
      category: metadata.category as string | undefined,
      sourceNote: undefined,
      sortOrder: maxOrder + 1,
      createdAt: ts,
      updatedAt: ts,
    }

    const tx = db.transaction([WORLD_IMAGES_STORE, WORLD_BLOBS_STORE], 'readwrite')
    await tx.objectStore(WORLD_IMAGES_STORE).put(meta)
    await tx.objectStore(WORLD_BLOBS_STORE).put({ id: meta.id, blob })
    await tx.done
    return meta
  }

  async function getMetadata(id: string): Promise<WorldImageMetadata | undefined> {
    const db = await getTestDB()
    return await db.get(WORLD_IMAGES_STORE, id)
  }

  async function getBlob(id: string): Promise<{ id: string; blob: Blob } | undefined> {
    const db = await getTestDB()
    return await db.get(WORLD_BLOBS_STORE, id)
  }

  async function getAllMetadata(): Promise<WorldImageMetadata[]> {
    const db = await getTestDB()
    const all = await db.getAll(WORLD_IMAGES_STORE)
    return (all as WorldImageMetadata[]).sort((a, b) => a.sortOrder - b.sortOrder)
  }

  async function updateMetadata(meta: WorldImageMetadata): Promise<void> {
    const db = await getTestDB()
    await db.put(WORLD_IMAGES_STORE, { ...meta, updatedAt: now() })
  }

  async function deleteImage(id: string): Promise<void> {
    const db = await getTestDB()
    const tx = db.transaction([WORLD_IMAGES_STORE, WORLD_BLOBS_STORE], 'readwrite')
    await tx.objectStore(WORLD_IMAGES_STORE).delete(id)
    await tx.objectStore(WORLD_BLOBS_STORE).delete(id)
    await tx.done
    // 並び順を正規化
    const all = (await db.getAll(WORLD_IMAGES_STORE) as WorldImageMetadata[])
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const ts = now()
    const tx2 = db.transaction(WORLD_IMAGES_STORE, 'readwrite')
    for (let i = 0; i < all.length; i++) {
      await tx2.store.put({ ...all[i], sortOrder: i, updatedAt: ts })
    }
    await tx2.done
  }

  async function updateSortOrders(orderedIds: string[]): Promise<void> {
    const db = await getTestDB()
    const ts = now()
    const tx = db.transaction(WORLD_IMAGES_STORE, 'readwrite')
    for (let i = 0; i < orderedIds.length; i++) {
      const meta = await tx.store.get(orderedIds[i])
      if (meta) {
        await tx.store.put({ ...meta, sortOrder: i, updatedAt: ts })
      }
    }
    await tx.done
  }

  return { saveImage, getMetadata, getBlob, getAllMetadata, updateMetadata, deleteImage, updateSortOrders }
}

const makeBlob = (content = 'fake-image-data') =>
  new Blob([content], { type: 'image/jpeg' })

const makeMetaInput = (overrides: Record<string, unknown> = {}) => ({
  fileName: 'test.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024,
  ...overrides,
})

describe('saveImage / getMetadata', () => {
  it('saveImage した後 getMetadata で取得できる', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const saved = await db.saveImage(makeMetaInput({ title: 'テスト画像' }), blob)

    expect(saved.id).toBeTruthy()
    expect(saved.title).toBe('テスト画像')
    expect(saved.fileName).toBe('test.jpg')
    expect(saved.createdAt).toBeTruthy()

    const fetched = await db.getMetadata(saved.id)
    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe(saved.id)
    expect(fetched?.title).toBe('テスト画像')
  })

  it('存在しないIDは undefined を返す', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const result = await db.getMetadata('non-existent-id')
    expect(result).toBeUndefined()
  })
})

describe('saveImage / getBlob', () => {
  it('saveImage した後 getBlob で取得できる', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob('image-content')
    const saved = await db.saveImage(makeMetaInput(), blob)

    const record = await db.getBlob(saved.id)
    expect(record).toBeDefined()
    expect(record?.blob).toBeTruthy()
  })

  it('存在しないIDは undefined を返す', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const result = await db.getBlob('non-existent-id')
    expect(result).toBeUndefined()
  })
})

describe('updateMetadata', () => {
  it('メタデータを更新できる', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const saved = await db.saveImage(makeMetaInput({ title: '元のタイトル' }), blob)

    await db.updateMetadata({ ...saved, title: '新しいタイトル' })

    const fetched = await db.getMetadata(saved.id)
    expect(fetched?.title).toBe('新しいタイトル')
  })
})

describe('deleteImage', () => {
  it('画像を削除できる', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const saved = await db.saveImage(makeMetaInput(), blob)

    await db.deleteImage(saved.id)

    const fetchedMeta = await db.getMetadata(saved.id)
    const fetchedBlob = await db.getBlob(saved.id)
    expect(fetchedMeta).toBeUndefined()
    expect(fetchedBlob).toBeUndefined()
  })

  it('削除後に sortOrder が正規化される', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const a = await db.saveImage(makeMetaInput({ fileName: 'a.jpg' }), blob)
    const b = await db.saveImage(makeMetaInput({ fileName: 'b.jpg' }), blob)
    const c = await db.saveImage(makeMetaInput({ fileName: 'c.jpg' }), blob)

    await db.deleteImage(b.id)

    const all = await db.getAllMetadata()
    expect(all.map((m) => m.sortOrder)).toEqual([0, 1])
    const ids = all.map((m) => m.id)
    expect(ids).toContain(a.id)
    expect(ids).toContain(c.id)
  })
})

describe('updateSortOrders', () => {
  it('並び順を更新できる', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const a = await db.saveImage(makeMetaInput({ fileName: 'a.jpg' }), blob)
    const b = await db.saveImage(makeMetaInput({ fileName: 'b.jpg' }), blob)
    const c = await db.saveImage(makeMetaInput({ fileName: 'c.jpg' }), blob)

    await db.updateSortOrders([c.id, a.id, b.id])

    const all = await db.getAllMetadata()
    expect(all[0].id).toBe(c.id)
    expect(all[1].id).toBe(a.id)
    expect(all[2].id).toBe(b.id)
  })
})

describe('getAllMetadata', () => {
  it('sortOrder 順に返される', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const blob = makeBlob()
    const a = await db.saveImage(makeMetaInput({ fileName: 'a.jpg' }), blob)
    const b = await db.saveImage(makeMetaInput({ fileName: 'b.jpg' }), blob)
    const c = await db.saveImage(makeMetaInput({ fileName: 'c.jpg' }), blob)

    const all = await db.getAllMetadata()
    expect(all[0].id).toBe(a.id)
    expect(all[1].id).toBe(b.id)
    expect(all[2].id).toBe(c.id)
  })

  it('空の場合は空配列を返す', async () => {
    const db = createTestDB(`test-db-${generateId()}`)
    const all = await db.getAllMetadata()
    expect(all).toEqual([])
  })
})
