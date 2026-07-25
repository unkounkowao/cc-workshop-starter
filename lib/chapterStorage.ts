'use client'
import { CHAPTER_STORAGE_KEY, CHAPTER_DATA_VERSION } from './constants'
import type { ChapterNoteData, StoryChapterNote } from './types'

function getDefault(): ChapterNoteData {
  return { version: CHAPTER_DATA_VERSION, chapters: [] }
}

export function loadChapterData(): ChapterNoteData {
  try {
    const raw = localStorage.getItem(CHAPTER_STORAGE_KEY)
    if (!raw) return getDefault()
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.chapters)) return getDefault()
    return parsed as ChapterNoteData
  } catch { return getDefault() }
}

export function saveChapterData(data: ChapterNoteData): void {
  localStorage.setItem(CHAPTER_STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event('local-data-changed'))
}

export function loadChapters(yearId: string): StoryChapterNote[] {
  const data = loadChapterData()
  return data.chapters
    .filter(c => c.yearId === yearId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function saveChapter(chapter: StoryChapterNote): void {
  const data = loadChapterData()
  const idx = data.chapters.findIndex(c => c.id === chapter.id)
  if (idx >= 0) data.chapters[idx] = chapter
  else data.chapters.push(chapter)
  saveChapterData(data)
}

export function deleteChapter(id: string): void {
  const data = loadChapterData()
  data.chapters = data.chapters.filter(c => c.id !== id)
  saveChapterData(data)
}

export function getNextChapterSortOrder(yearId: string): number {
  const chapters = loadChapters(yearId)
  return chapters.length === 0 ? 0 : Math.max(...chapters.map(c => c.sortOrder)) + 1
}
