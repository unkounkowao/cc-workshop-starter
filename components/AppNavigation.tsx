'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const basePath = '/cc-workshop-starter'

function normalizePath(pathname: string): string {
  if (pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length) || '/'
  }
  return pathname
}

export default function AppNavigation() {
  const pathname = usePathname()
  const normalized = normalizePath(pathname)

  const isCharacters = normalized === '/' || normalized.startsWith('/character')
  const isWorld = normalized.startsWith('/world')

  const linkClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
        <Link href="/" className={linkClass(isCharacters)}>
          キャラクター
        </Link>
        <Link href="/world" className={linkClass(isWorld)}>
          世界観ギャラリー
        </Link>
      </div>
    </nav>
  )
}
