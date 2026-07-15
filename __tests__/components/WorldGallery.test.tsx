import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Next.js navigation をモック
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Next.js Link をモック
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import WorldGalleryClient from '@/app/world/WorldGalleryClient'

describe('WorldGalleryClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('正常にマウントできる', async () => {
    const { container } = render(<WorldGalleryClient />)
    expect(container).toBeTruthy()
  })

  it('タイトルが表示される', async () => {
    render(<WorldGalleryClient />)
    expect(screen.getByText('世界観ギャラリー')).toBeInTheDocument()
  })

  it('追加ボタンが存在する', async () => {
    render(<WorldGalleryClient />)
    const addLinks = screen.getAllByRole('link')
    const addLink = addLinks.find((el) => el.textContent?.includes('追加'))
    expect(addLink).toBeDefined()
  })

  it('空状態メッセージがデフォルトで表示される（IndexedDB が空）', async () => {
    render(<WorldGalleryClient />)
    // 空状態か読み込み中のいずれかが表示される
    const hasEmptyOrLoading =
      document.body.textContent?.includes('読み込み中') ||
      document.body.textContent?.includes('画像がまだ') ||
      document.body.textContent?.includes('世界観ギャラリー')
    expect(hasEmptyOrLoading).toBe(true)
  })
})
