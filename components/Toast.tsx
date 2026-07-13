'use client'
import { useEffect } from 'react'
import type { Toast as ToastType } from '@/lib/types'

type Props = {
  toasts: ToastType[]
  onRemove: (id: string) => void
}

export default function Toast({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const bgColor =
    toast.type === 'success'
      ? 'bg-green-700'
      : toast.type === 'error'
      ? 'bg-red-700'
      : 'bg-yellow-600'

  return (
    <div
      role="alert"
      className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-start justify-between gap-2`}
    >
      <span className="text-sm leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-white/80 hover:text-white text-lg leading-none"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  )
}
