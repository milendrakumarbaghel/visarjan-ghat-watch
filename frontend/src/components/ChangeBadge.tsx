import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useApp } from '../state'
import type { YearRisk } from '../types'

export interface YearChange {
  from: number
  to: number
  delta: number
  direction: 'worse' | 'better' | 'similar'
}

/** Score points within which two years count as similar. */
const SIMILAR_WITHIN = 3

/** Compares a ghat's latest tested year with the tested year before it. */
export function yearChange(trend: YearRisk[] | null | undefined, ghatId: string): YearChange | null {
  if (!trend) return null
  const tested = trend
    .map((y) => ({ year: y.year, g: y.ghats.find((g) => g.ghatId === ghatId) }))
    .filter((p) => p.g?.tested)
  if (tested.length < 2) return null
  const [prev, last] = tested.slice(-2)
  const delta = last.g!.score - prev.g!.score
  const direction = delta > SIMILAR_WITHIN ? 'worse' : delta < -SIMILAR_WITHIN ? 'better' : 'similar'
  return { from: prev.year, to: last.year, delta, direction }
}

const style = {
  worse: { Icon: TrendingUp, className: 'bg-red-50 text-red-700 ring-red-200' },
  better: { Icon: TrendingDown, className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  similar: { Icon: Minus, className: 'bg-slate-50 text-slate-600 ring-slate-200' },
} as const

/** "Worse than 2024" with an arrow: higher risk score means worse water. */
export function ChangeBadge({ change }: { change: YearChange | null }) {
  const { t } = useApp()
  if (!change) return null
  const { Icon, className } = style[change.direction]
  const sign = change.delta > 0 ? '+' : ''
  return (
    <span
      title={t('changeHelp', { from: change.from, to: change.to })}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {t(change.direction, { year: change.from })}
      <span className="font-medium opacity-75">
        ({sign}
        {Math.round(change.delta)})
      </span>
    </span>
  )
}
