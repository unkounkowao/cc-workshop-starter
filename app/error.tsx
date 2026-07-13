'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          エラーが発生しました。ページを再読み込みしてください。
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  )
}
