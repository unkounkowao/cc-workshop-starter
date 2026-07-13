import type { Metadata } from 'next'
import './globals.css'

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
        {children}
      </body>
    </html>
  )
}
