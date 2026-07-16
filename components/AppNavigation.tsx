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
  const isMemo = normalized.startsWith('/memo')

  const linkClass = (active: boolean) =>
    `px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
      active
        ? 'bg-sky-500 text-white shadow-sm'
        : 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
    }`

  return (
    <nav className="bg-white border-b border-sky-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-sky-600 tracking-wide">Novel Sheet</span>
        <div className="flex gap-1">
          <Link href="/" className={linkClass(isCharacters)}>
            キャラクター
          </Link>
          <Link href="/world" className={linkClass(isWorld)}>
            世界観
          </Link>
          <Link href="/memo" className={linkClass(isMemo)}>
            出来事メモ
          </Link>
        </div>
      </div>
    </nav>
  )
}
