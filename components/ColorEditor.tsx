'use client'
import { useState, useCallback } from 'react'
import { isValidHex, normalizeHex } from '@/lib/validation'
import { generateId } from '@/lib/utils'
import type { ImageColor } from '@/lib/types'

type Props = {
  colors: ImageColor[]
  onChange: (colors: ImageColor[]) => void
}

export default function ColorEditor({ colors, onChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addColor = useCallback(() => {
    onChange([...colors, { id: generateId(), hex: '#000000', label: '' }])
  }, [colors, onChange])

  const removeColor = useCallback(
    (id: string) => {
      onChange(colors.filter((c) => c.id !== id))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [colors, onChange]
  )

  const updateHex = useCallback(
    (id: string, hex: string) => {
      onChange(colors.map((c) => (c.id === id ? { ...c, hex } : c)))
      if (!isValidHex(hex)) {
        setErrors((prev) => ({ ...prev, [id]: '無効なカラーコードです' }))
      } else {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    },
    [colors, onChange]
  )

  const handlePickerChange = useCallback(
    (id: string, hex: string) => {
      const normalized = normalizeHex(hex)
      onChange(colors.map((c) => (c.id === id ? { ...c, hex: normalized } : c)))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [colors, onChange]
  )

  const updateLabel = useCallback(
    (id: string, label: string) => {
      onChange(colors.map((c) => (c.id === id ? { ...c, label } : c)))
    },
    [colors, onChange]
  )

  return (
    <div>
      <div className="flex flex-col gap-3">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex flex-col sm:flex-row gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            {/* カラーピッカー + HEX入力 */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden shrink-0 relative"
                style={{ backgroundColor: isValidHex(color.hex) ? color.hex : '#cccccc' }}
              >
                <input
                  type="color"
                  value={isValidHex(color.hex) ? normalizeHex(color.hex) : '#000000'}
                  onChange={(e) => handlePickerChange(color.id, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="カラーピッカー"
                  title="クリックして色を選択"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => updateHex(color.id, e.target.value)}
                  onBlur={(e) => {
                    if (isValidHex(e.target.value)) {
                      handlePickerChange(color.id, e.target.value)
                    }
                  }}
                  placeholder="#000000"
                  className="w-32 px-2 py-1.5 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  aria-label="カラーコード（HEX）"
                />
                {errors[color.id] && (
                  <p className="text-red-500 text-xs">{errors[color.id]}</p>
                )}
              </div>
            </div>
            {/* 色名 */}
            <input
              type="text"
              value={color.label ?? ''}
              onChange={(e) => updateLabel(color.id, e.target.value)}
              placeholder="色名（任意）"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              aria-label="色名または補足"
            />
            {/* 削除 */}
            <button
              type="button"
              onClick={() => removeColor(color.id)}
              className="shrink-0 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px] sm:min-h-0"
              aria-label={`カラー ${color.hex} を削除`}
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addColor}
        className="mt-3 px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors min-h-[44px]"
      >
        ＋ カラーを追加
      </button>
    </div>
  )
}
