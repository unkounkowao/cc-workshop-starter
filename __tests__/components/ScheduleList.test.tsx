import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('公式イベント')).toBeInTheDocument()
  })

  it('「公式スケジュール」バッジが表示される', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('公式スケジュール')).toBeInTheDocument()
  })

  it('詳細リンクが /schedule/official/detail?id=entry-1 に設定される', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
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
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('プロットイベント')).toBeInTheDocument()
  })

  it('「プロット・出来事」バッジが表示される', () => {
    render(
      <ScheduleEntryCard
        entry={makePlotEntry()}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('プロット・出来事')).toBeInTheDocument()
  })

  it('詳細リンクが /schedule/plot/detail?id=entry-2 に設定される', () => {
    render(
      <ScheduleEntryCard
        entry={makePlotEntry()}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
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
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    // summary用のpタグが表示されないことを確認（summaryフィールドはp.line-clamp-2.leading-relaxedで表示される）
    expect(document.querySelector('p.line-clamp-2')).toBeNull()
  })

  it('categoryがない場合はカテゴリラベルが表示されない', () => {
    const entry = makeOfficialEntry({ category: undefined })
    render(
      <ScheduleEntryCard
        entry={entry}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    // カテゴリ表示がないことを確認（アイコンが表示されていない）
    expect(screen.queryByText(/🏷/)).toBeNull()
  })

  it('関連キャラクターがない場合はキャラクター欄が表示されない', () => {
    const entry = makeOfficialEntry({ relatedCharacterIds: [] })
    render(
      <ScheduleEntryCard
        entry={entry}
        characters={mockCharacters}
        index={0}
        total={2}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.queryByRole('group', { name: '関連キャラクター' })).toBeNull()
  })
})

describe('ScheduleEntryCard - 上へ/下へボタン', () => {
  it('上へボタンをクリックするとonMoveUpが呼ばれる', () => {
    const onMoveUp = vi.fn()
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={1}
        total={3}
        onMoveUp={onMoveUp}
        onMoveDown={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /上に移動/ }))
    expect(onMoveUp).toHaveBeenCalledWith('entry-1')
  })

  it('下へボタンをクリックするとonMoveDownが呼ばれる', () => {
    const onMoveDown = vi.fn()
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={1}
        total={3}
        onMoveUp={vi.fn()}
        onMoveDown={onMoveDown}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /下に移動/ }))
    expect(onMoveDown).toHaveBeenCalledWith('entry-1')
  })

  it('先頭要素の場合は上へボタンが無効になる', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={0}
        total={3}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /上に移動/ })).toBeDisabled()
  })

  it('末尾要素の場合は下へボタンが無効になる', () => {
    render(
      <ScheduleEntryCard
        entry={makeOfficialEntry()}
        characters={mockCharacters}
        index={2}
        total={3}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /下に移動/ })).toBeDisabled()
  })
})

