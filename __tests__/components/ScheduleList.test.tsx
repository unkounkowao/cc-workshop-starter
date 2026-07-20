import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScheduleEntryCard from '@/components/ScheduleEntryCard'
import type { ScheduleEntry } from '@/lib/types'
import type { Character } from '@/lib/types'

// next/link モック
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// next/navigation モック
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

function makeOfficialEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'entry-1',
    yearId: 'year-1',
    monthId: 'month-1',
    type: 'official',
    title: '公式イベント',
    relatedCharacterIds: [],
    relatedEntryIds: [],
    relatedWorldImageIds: [],
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makePlotEntry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'entry-2',
    yearId: 'year-1',
    monthId: 'month-1',
    type: 'plot',
    title: 'プロットイベント',
    relatedCharacterIds: [],
    relatedEntryIds: [],
    relatedWorldImageIds: [],
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const mockCharacters: Character[] = []

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ScheduleEntryCard - officialタイプ', () => {
  it('タイトルが表示される', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
      />
    )
    expect(screen.getByText('公式イベント')).toBeInTheDocument()
  })

  it('詳細リンクが /schedule/official/detail?id=entry-1 に設定される', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
      />
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/schedule/official/detail?id=entry-1')
  })
})

describe('ScheduleEntryCard - plotタイプ', () => {
  it('タイトルが表示される', () => {
    render(
      <ScheduleEntryCard
        entry={makePlotEntry()}
        characters={mockCharacters}
      />
    )
    expect(screen.getByText('プロットイベント')).toBeInTheDocument()
  })

  it('詳細リンクが /schedule/plot/detail?id=entry-2 に設定される', () => {
    render(
      <ScheduleEntryCard
        entry={makePlotEntry()}
        characters={mockCharacters}
      />
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/schedule/plot/detail?id=entry-2')
  })
})

describe('ScheduleEntryCard - 空フィールドの非表示', () => {
  it('summaryがない場合は表示されない', () => {
    const entry = makeOfficialEntry({ summary: undefined })
    render(
      <ScheduleEntryCard
        entry={entry}
        characters={mockCharacters}
      />
    )
    expect(document.querySelector('p.line-clamp-2')).toBeNull()
  })

  it('関連キャラクターがない場合はキャラクター欄が表示されない', () => {
    const entry = makeOfficialEntry({ relatedCharacterIds: [] })
    render(
      <ScheduleEntryCard
        entry={entry}
        characters={mockCharacters}
      />
    )
    expect(screen.queryByRole('group', { name: '関連キャラクター' })).toBeNull()
  })
})

