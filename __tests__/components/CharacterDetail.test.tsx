import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CharacterDetail from '@/components/CharacterDetail'
import type { Character } from '@/lib/types'

const baseChar: Character = {
  id: 'test',
  name: 'テストキャラ',
  imageColors: [],
  sortOrder: 0,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('CharacterDetail', () => {
  it('入力済み項目を表示する', () => {
    render(<CharacterDetail character={{ ...baseChar, theme: '成長の物語' }} />)
    expect(screen.getByText('成長の物語')).toBeInTheDocument()
  })

  it('未入力項目を表示しない', () => {
    render(<CharacterDetail character={baseChar} />)
    expect(screen.queryByText('テーマ')).not.toBeInTheDocument()
    expect(screen.queryByText('性格')).not.toBeInTheDocument()
  })

  it('カラーチップを表示する', () => {
    const char: Character = {
      ...baseChar,
      imageColors: [{ id: '1', hex: '#FF0000', label: '赤' }],
    }
    render(<CharacterDetail character={char} />)
    expect(screen.getByLabelText(/カラー: #FF0000/)).toBeInTheDocument()
  })

  it('空白のみの項目を表示しない', () => {
    render(<CharacterDetail character={{ ...baseChar, theme: '   ' }} />)
    expect(screen.queryByText('テーマ')).not.toBeInTheDocument()
  })
})
