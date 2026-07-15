import type { Metadata } from 'next'
import './globals.css'
import AppNavigation from '@/components/AppNavigation'

export const metadata: Metadata = {
  title: 'キャラクターシート',
  description: '小説執筆用キャラクター設定管理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AppNavigation />
        {children}
      </body>
    </html>
  )
}
