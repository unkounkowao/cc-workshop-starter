import { describe, it, expect } from 'vitest'

describe('並び替え処理', () => {
  it('配列の要素を上へ移動できる', () => {
    const arr = ['a', 'b', 'c']
    const idx = 1
    ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
    expect(arr).toEqual(['b', 'a', 'c'])
  })

  it('配列の要素を下へ移動できる', () => {
    const arr = ['a', 'b', 'c']
    const idx = 1
    ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
    expect(arr).toEqual(['a', 'c', 'b'])
  })

  it('最初の要素は上に移動できない', () => {
    const canMoveUp = (i: number) => i > 0
    expect(canMoveUp(0)).toBe(false)
  })

  it('最後の要素は下に移動できない', () => {
    const length = 3
    const canMoveDown = (i: number) => i < length - 1
    expect(canMoveDown(2)).toBe(false)
  })
})
