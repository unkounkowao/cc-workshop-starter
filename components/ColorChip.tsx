import { getContrastColor } from '@/lib/utils'
import type { ImageColor } from '@/lib/types'

type Props = {
  color: ImageColor
  size?: 'sm' | 'md'
}

export default function ColorChip({ color, size = 'md' }: Props) {
  const textColor = getContrastColor(color.hex)
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-xs'

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClass} rounded-full border border-black/10 dark:border-white/20 shrink-0`}
        style={{ backgroundColor: color.hex, color: textColor }}
        title={color.label ? `${color.hex} / ${color.label}` : color.hex}
        aria-label={`カラー: ${color.hex}${color.label ? ` (${color.label})` : ''}`}
      />
      {size === 'md' && (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {color.hex}
          {color.label && <span className="ml-1 text-gray-500">/ {color.label}</span>}
        </span>
      )}
    </div>
  )
}
