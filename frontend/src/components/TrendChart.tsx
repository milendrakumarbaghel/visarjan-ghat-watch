import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartFrame, ChartTooltip, type LegendEntry } from './charts'
import { StatusBadge } from './ui'
import { INK, SERIES, STATUS, axisProps } from '../lib/chartTheme'
import { CLASS_B, PARAMETERS, PHASES, festivalLabel } from '../lib/ghats'
import { useApp } from '../state'
import type { ReadingView } from '../types'

interface Point {
  key: string
  tick: string
  short: string
  event: string
  phase: string
  value: number | null
  reading: ReadingView | undefined
}

/** One parameter at one ghat across every festival and stage, against its class B limit. */
export function TrendChart({ readings, events, parameter }: { readings: ReadingView[]; events: string[]; parameter: string }) {
  const { t, lang } = useApp()
  const meta = PARAMETERS.find((p) => p.name === parameter)
  const limit = CLASS_B[parameter]
  const name = lang === 'hi' ? meta?.hi ?? parameter : parameter

  const points: Point[] = events.flatMap((event) => {
    const [festival, year] = event.split(' ')
    return PHASES.map((phase) => {
      const reading = readings.find(
        (r) => r.parameter === parameter && r.festival === festival && r.year === Number(year) && r.phase === phase,
      )
      return {
        key: `${event}-${phase}`,
        tick: phase === 'during' ? festivalLabel(festival, Number(year), lang) : '',
        short: t(`${phase}Short` as 'preShort'),
        event: festivalLabel(festival, Number(year), lang),
        phase: t(phase),
        value: reading?.value ?? null,
        reading,
      }
    })
  })

  const unit = meta?.unit ?? ''
  const legend: LegendEntry[] = [{ label: t('measured'), color: SERIES[0], kind: 'line' }]
  if (limit) legend.push({ label: `${t('cpcbLimit')} (${limit.text})`, color: STATUS.critical, kind: 'dashed' })

  return (
    <ChartFrame
      title={t('trendTitle', { parameter: name })}
      subtitle={unit ? `${unit} · ${t('gapNote')}` : t('gapNote')}
      legend={legend}
      columns={[
        { key: 'event', label: t('event') },
        { key: 'phase', label: t('phase') },
        { key: 'value', label: t('value'), numeric: true },
        { key: 'status', label: t('status') },
        { key: 'page', label: t('sourcePage') },
      ]}
      rows={points.map((p) => ({
        event: p.event,
        phase: p.phase,
        value: p.reading ? p.reading.valueAsPrinted || '–' : '–',
        status: p.reading ? <StatusBadge status={p.reading.status} /> : <StatusBadge status="MISSING" />,
        page: p.reading && !p.reading.pdfUrl ? (
          t('enteredHere')
        ) : p.reading ? (
          <a className="text-brand-700 underline" href={p.reading.pdfUrl ?? undefined} target="_blank" rel="noreferrer">
            {t('page')}
            {p.reading.sourcePage}
          </a>
        ) : (
          t('noTable')
        ),
      }))}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 10, right: 16, bottom: 4, left: -12 }}>
          <CartesianGrid vertical={false} stroke={INK.grid} />
          <XAxis
            dataKey="key"
            interval={0}
            height={44}
            {...axisProps}
            tick={(props) => {
              const { x, y, index } = props as { x: number; y: number; index: number }
              const p = points[index]
              if (!p) return <g />
              return (
                <g transform={`translate(${x},${y})`}>
                  {points.length <= 24 && (
                    <text dy={12} textAnchor="middle" fontSize={10} fill={INK.muted}>
                      {p.short}
                    </text>
                  )}
                  {p.tick && (
                    <text dy={points.length <= 24 ? 28 : 14} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK.secondary}>
                      {p.tick}
                    </text>
                  )}
                </g>
              )
            }}
          />
          <YAxis {...axisProps} axisLine={false} domain={[0, 'auto']} />
          <Tooltip
            content={
              <ChartTooltip
                unit={unit}
                labelFormatter={(_, payload) => {
                  const p = payload[0]?.payload as unknown as Point | undefined
                  return p ? `${p.event} · ${p.phase}${p.reading ? ` · ${t('page')}${p.reading.sourcePage}` : ''}` : ''
                }}
              />
            }
          />
          {limit?.min !== undefined && (
            <ReferenceLine y={limit.min} stroke={STATUS.critical} strokeDasharray="5 4" strokeWidth={1.5} />
          )}
          {limit?.max !== undefined && (
            <ReferenceLine y={limit.max} stroke={STATUS.critical} strokeDasharray="5 4" strokeWidth={1.5} />
          )}
          <Line
            type="linear"
            dataKey="value"
            name={name}
            stroke={SERIES[0]}
            strokeWidth={2}
            dot={{ r: 4, fill: SERIES[0], stroke: INK.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: INK.surface, strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
