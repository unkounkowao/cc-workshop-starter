import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorEditor from '@/components/ColorEditor'

describe('ColorEditor', () => {
  it('カラーを追加できる', () => {
    const onChange = vi.fn()
    render(<ColorEditor colors={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('＋ カラーを追加'))
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ hex: '#000000' }),
      ])
    )
  })

  it('無効なHEXを入力するとエラーが表示される', () => {
    const colors = [{ id: '1', hex: '#FF0000' }]
    render(<ColorEditor colors={colors} onChange={vi.fn()} />)
    const input = screen.getByLabelText('カラーコード（HEX）')
    fireEvent.change(input, { target: { value: 'invalid' } })
    expect(screen.getByText(/無効なカラーコード/)).toBeInTheDocument()
  })
})
