import { useState, type ReactNode } from 'react'
import { useApp } from '../state'
import { INK } from '../lib/chartTheme'
import { Segmented } from './ui'

export interface LegendEntry {
  label: string
  color: string
  /** line = a short line key; swatch = a filled square; hatch = not-sampled pattern. */
  kind?: 'line' | 'swatch' | 'dashed' | 'hatch'
}

export function Legend({ items }: { items: LegendEntry[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-slate-600">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          {i.kind === 'line' ? (
            <span className="inline-block h-0.5 w-4 rounded" style={{ background: i.color }} />
          ) : i.kind === 'dashed' ? (
            <span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : i.kind === 'hatch' ? (
            <span className="missing-hatch inline-block size-3 rounded-sm ring-1 ring-slate-300" />
          ) : (
            <span className="inline-block size-2.5 rounded-full" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  )
}

export interface TableColumn {
  key: string
  label: string
  numeric?: boolean
}

/**
 * Title, legend and a chart / table switch. The table is the accessible twin of the chart:
 * every value in the chart can be read there without hovering.
 */
export function ChartFrame({
  title,
  subtitle,
  legend,
  columns,
  rows,
  children,
  footnote,
}: {
  title: string
  subtitle?: string
  legend?: LegendEntry[]
  columns: TableColumn[]
  rows: Record<string, ReactNode>[]
  children: ReactNode
  footnote?: string
}) {
  const { t } = useApp()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <Segmented
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: t('chart') },
            { value: 'table', label: t('table') },
          ]}
        />
      </div>
      {legend && legend.length > 0 && view === 'chart' && (
        <div className="mb-3">
          <Legend items={legend} />
        </div>
      )}
      {view === 'chart' ? (
        children
      ) : (
        <div className="scroll-thin max-h-80 overflow-auto rounded-xl ring-1 ring-slate-200">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`px-3 py-2 font-medium ${c.numeric ? 'text-right' : 'text-left'}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-100 transition hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-3 py-1.5 ${c.numeric ? 'text-right tabular-nums' : ''}`}>
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footnote && <p className="mt-3 text-xs text-slate-500">{footnote}</p>}
    </div>
  )
}

interface TooltipPayloadItem {
  name?: string
  value?: number | string | null
  color?: string
  dataKey?: string | number
  payload?: Record<string, unknown>
}

/** Recharts tooltip in the app's style. Values wear text ink; the colour key sits beside them. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = '',
  labelFormatter,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  unit?: string
  labelFormatter?: (label: string | number | undefined, payload: TooltipPayloadItem[]) => ReactNode
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="min-w-40 rounded-xl bg-white px-3 py-2.5 text-xs shadow-lift ring-1 ring-slate-200">
      <div className="mb-1 font-semibold" style={{ color: INK.primary }}>
        {labelFormatter ? labelFormatter(label, payload) : label}
      </div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-2" style={{ color: INK.secondary }}>
          <span className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums" style={{ color: INK.primary }}>
            {p.value === null || p.value === undefined ? '–' : `${p.value}${unit ? ` ${unit}` : ''}`}
          </span>
        </div>
      ))}
    </div>
  )
}
