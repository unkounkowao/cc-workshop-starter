import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CharacterForm from '@/components/CharacterForm'
import type { Character } from '@/lib/types'

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
vi.stubGlobal('localStorage', localStorageMock)

beforeEach(() => {
  localStorageMock.clear()
})

describe('CharacterForm', () => {
  it('名前未入力の場合は保存できない', async () => {
    const onSave = vi.fn()
    render(<CharacterForm onSave={onSave} onCancel={() => {}} />)

    // 保存ボタンは上部・下部に2つある。最初のものを使用
    const submitBtns = screen.getAllByRole('button', { name: '保存' })
    const form = submitBtns[0].closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(screen.getByText(/名前は必須/)).toBeInTheDocument()
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('名前を入力して保存できる', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<CharacterForm onSave={onSave} onCancel={() => {}} />)

    await user.type(screen.getByLabelText(/名前/), '田中太郎')

    // 保存ボタンは上部・下部に2つある。最初のものを使用
    const submitBtns = screen.getAllByRole('button', { name: '保存' })
    const form = submitBtns[0].closest('form')
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledOnce()
      expect(onSave.mock.calls[0][0].name).toBe('田中太郎')
    })
  })

  it('既存キャラクターの情報が初期値として表示される', () => {
    const existing: Character = {
      id: 'test-id',
      name: '既存キャラ',
      theme: 'テスト用テーマ',
      imageColors: [],
      sortOrder: 0,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    render(<CharacterForm initialCharacter={existing} onSave={vi.fn()} onCancel={() => {}} />)
    expect(screen.getByDisplayValue('既存キャラ')).toBeInTheDocument()
  })
})
