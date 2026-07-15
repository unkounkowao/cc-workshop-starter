import { openDB, type IDBPDatabase } from 'idb'
import {
  WORLD_DB_NAME,
  WORLD_DB_VERSION,
  WORLD_IMAGES_STORE,
  WORLD_BLOBS_STORE,
} from './constants'
import { generateId, now } from './utils'
import type { WorldImageMetadata } from './types'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(WORLD_DB_NAME, WORLD_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(WORLD_IMAGES_STORE)) {
          db.createObjectStore(WORLD_IMAGES_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(WORLD_BLOBS_STORE)) {
          db.createObjectStore(WORLD_BLOBS_STORE, { keyPath: 'id' })
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked')
      },
      blocking() {
        dbPromise = null
      },
      terminated() {
        dbPromise = null
      },
    })
  }
  return dbPromise
}

export async function getAllMetadata(): Promise<WorldImageMetadata[]> {
  try {
    const db = await getDB()
    const all = await db.getAll(WORLD_IMAGES_STORE)
    return (all as WorldImageMetadata[]).sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (e) {
    console.error('getAllMetadata failed', e)
    return []
  }
}

export async function getMetadata(id: string): Promise<WorldImageMetadata | undefined> {
  try {
    const db = await getDB()
    return await db.get(WORLD_IMAGES_STORE, id)
  } catch (e) {
    console.error('getMetadata failed', e)
    return undefined
  }
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  try {
    const db = await getDB()
    const record = await db.get(WORLD_BLOBS_STORE, id)
    return record?.blob
  } catch (e) {
    console.error('getBlob failed', e)
    return undefined
  }
}

export async function saveImage(
  metadata: Omit<WorldImageMetadata, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
    id?: string
    sortOrder?: number
  },
  blob: Blob
): Promise<WorldImageMetadata> {
  const db = await getDB()
  const ts = now()
  const all = await db.getAll(WORLD_IMAGES_STORE)
  const maxOrder = all.length > 0
    ? Math.max(...(all as WorldImageMetadata[]).map((m) => m.sortOrder))
    : -1

  const meta: WorldImageMetadata = {
    id: metadata.id ?? generateId(),
    fileName: metadata.fileName,
    mimeType: metadata.mimeType,
    width: metadata.width,
    height: metadata.height,
    fileSize: metadata.fileSize,
    title: metadata.title,
    caption: metadata.caption,
    altText: metadata.altText,
    category: metadata.category,
    sourceNote: metadata.sourceNote,
    sortOrder: metadata.sortOrder ?? maxOrder + 1,
    createdAt: ts,
    updatedAt: ts,
  }

  const tx = db.transaction([WORLD_IMAGES_STORE, WORLD_BLOBS_STORE], 'readwrite')
  await tx.objectStore(WORLD_IMAGES_STORE).put(meta)
  await tx.objectStore(WORLD_BLOBS_STORE).put({ id: meta.id, blob })
  await tx.done

  return meta
}

export async function updateMetadata(meta: WorldImageMetadata): Promise<void> {
  try {
    const db = await getDB()
    const updated = { ...meta, updatedAt: now() }
    await db.put(WORLD_IMAGES_STORE, updated)
  } catch (e) {
    console.error('updateMetadata failed', e)
    throw e
  }
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([WORLD_IMAGES_STORE, WORLD_BLOBS_STORE], 'readwrite')
  await tx.objectStore(WORLD_IMAGES_STORE).delete(id)
  await tx.objectStore(WORLD_BLOBS_STORE).delete(id)
  await tx.done
  // 並び順を正規化
  await normalizeSortOrders()
}

export async function normalizeSortOrders(): Promise<void> {
  try {
    const db = await getDB()
    const all = (await db.getAll(WORLD_IMAGES_STORE) as WorldImageMetadata[])
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const ts = now()
    const tx = db.transaction(WORLD_IMAGES_STORE, 'readwrite')
    for (let i = 0; i < all.length; i++) {
      await tx.store.put({ ...all[i], sortOrder: i, updatedAt: ts })
    }
    await tx.done
  } catch (e) {
    console.error('normalizeSortOrders failed', e)
  }
}

export async function updateSortOrders(orderedIds: string[]): Promise<void> {
  try {
    const db = await getDB()
    const ts = now()
    const tx = db.transaction(WORLD_IMAGES_STORE, 'readwrite')
    for (let i = 0; i < orderedIds.length; i++) {
      const meta = await tx.store.get(orderedIds[i])
      if (meta) {
        await tx.store.put({ ...meta, sortOrder: i, updatedAt: ts })
      }
    }
    await tx.done
  } catch (e) {
    console.error('updateSortOrders failed', e)
    throw e
  }
}

export async function getAllForBackup(): Promise<Array<{ meta: WorldImageMetadata; blob: Blob }>> {
  const db = await getDB()
  const metas = (await db.getAll(WORLD_IMAGES_STORE) as WorldImageMetadata[])
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const result: Array<{ meta: WorldImageMetadata; blob: Blob }> = []
  for (const meta of metas) {
    const record = await db.get(WORLD_BLOBS_STORE, meta.id)
    if (record?.blob) {
      result.push({ meta, blob: record.blob })
    }
  }
  return result
}

export async function clearAll(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction([WORLD_IMAGES_STORE, WORLD_BLOBS_STORE], 'readwrite')
  await tx.objectStore(WORLD_IMAGES_STORE).clear()
  await tx.objectStore(WORLD_BLOBS_STORE).clear()
  await tx.done
}
