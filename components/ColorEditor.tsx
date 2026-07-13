'use client'
import { useState, useCallback } from 'react'
import { isValidHex, normalizeHex } from '@/lib/validation'
import { generateId } from '@/lib/utils'
import type { ImageColor } from '@/lib/types'

type Props = {
  colors: ImageColor[]
  onChange: (colors: ImageColor[]) => void
}

// HEX (#RRGGBB) → [H, S, L]
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

// [H, S, L] → HEX (#RRGGBB)
function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100, ll = l / 100
  const a = sl * Math.min(ll, 1 - ll)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// スライダー共通スタイル
const sliderThumbClass =
  'w-full h-8 rounded cursor-pointer appearance-none ' +
  '[&::-webkit-slider-thumb]:appearance-none ' +
  '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 ' +
  '[&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-400 ' +
  '[&::-webkit-slider-thumb]:shadow ' +
  '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 ' +
  '[&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:bg-white ' +
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-gray-400 ' +
  '[&::-moz-range-thumb]:shadow'

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

  // HEXテキスト入力変更時
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

  // HEXを正規化して確定する（blur時・スライダー変更時）
  const commitHex = useCallback(
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

  // HSLスライダー変更時
  const updateHsl = useCallback(
    (id: string, h: number, s: number, l: number) => {
      const hex = hslToHex(h, s, l)
      onChange(colors.map((c) => (c.id === id ? { ...c, hex } : c)))
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
        {colors.map((color) => {
          const validHex = isValidHex(color.hex) ? normalizeHex(color.hex) : '#000000'
          const [h, s, l] = hexToHsl(validHex)
          const swatchBg = isValidHex(color.hex) ? color.hex : '#cccccc'

          // スライダー背景グラデーション
          const hueBg =
            'linear-gradient(to right, ' +
            'hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%), ' +
            'hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%), ' +
            'hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%), ' +
            'hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%), hsl(360,100%,50%))'

          const satBg =
            `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`

          const litBg =
            `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`

          return (
            <div
              key={color.id}
              className="flex flex-col gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              {/* 上段: スウォッチ + HEX入力 + 削除ボタン */}
              <div className="flex items-center gap-2">
                {/* 色スウォッチ */}
                <div
                  className="w-12 h-12 rounded-md border border-gray-300 dark:border-gray-600 shrink-0"
                  style={{ backgroundColor: swatchBg }}
                  role="img"
                  aria-label={`選択中の色: ${color.hex}`}
                />

                {/* HEX入力 */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => updateHex(color.id, e.target.value)}
                    onBlur={(e) => {
                      if (isValidHex(e.target.value)) {
                        commitHex(color.id, e.target.value)
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

                {/* 削除ボタン */}
                <button
                  type="button"
                  onClick={() => removeColor(color.id)}
                  className="shrink-0 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors min-h-[44px]"
                  aria-label={`カラー ${color.hex} を削除`}
                >
                  削除
                </button>
              </div>

              {/* HSLスライダー */}
              <div className="flex flex-col gap-2">
                {/* 色相 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 w-8 shrink-0">
                    色相
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={h}
                    onChange={(e) => updateHsl(color.id, Number(e.target.value), s, l)}
                    className={sliderThumbClass}
                    style={{ background: hueBg }}
                    aria-label="色相"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
                    {h}
                  </span>
                </div>

                {/* 彩度 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 w-8 shrink-0">
                    彩度
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={s}
                    onChange={(e) => updateHsl(color.id, h, Number(e.target.value), l)}
                    className={sliderThumbClass}
                    style={{ background: satBg }}
                    aria-label="彩度"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
                    {s}%
                  </span>
                </div>

                {/* 明度 */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 w-8 shrink-0">
                    明度
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={l}
                    onChange={(e) => updateHsl(color.id, h, s, Number(e.target.value))}
                    className={sliderThumbClass}
                    style={{ background: litBg }}
                    aria-label="明度"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right shrink-0">
                    {l}%
                  </span>
                </div>
              </div>

              {/* 色名入力 */}
              <input
                type="text"
                value={color.label ?? ''}
                onChange={(e) => updateLabel(color.id, e.target.value)}
                placeholder="色名（任意）"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                aria-label="色名または補足"
              />
            </div>
          )
        })}
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
