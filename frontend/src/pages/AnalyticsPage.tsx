import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api'
import { ChartFrame, ChartTooltip } from '../components/charts'
import { Card, ErrorBox, Loading, PageHeader, Segmented, Select, Tabs } from '../components/ui'
import { INK, SERIES, STATUS, axisProps, ghatColor } from '../lib/chartTheme'
import { CLASS_B, GHAT_ORDER, GHAT_SHORT, PARAMETERS, fmt } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { ReadingView } from '../types'

type Tab = 'ghats' | 'years' | 'festivals'
type Stat = 'avg' | 'worst'

interface Summary {
  value: number | null
  tests: number
  bdl: number
  missing: number
}

function summarise(rows: ReadingView[], parameter: string, stat: Stat): Summary {
  const values = rows.map((r) => r.value).filter((v): v is number => v !== null)
  const bdl = rows.filter((r) => r.status === 'BELOW_DETECTION').length
  const missing = rows.filter((r) => r.status === 'MISSING').length
  let value: number | null = null
  if (values.length > 0) {
    if (stat === 'avg') value = values.reduce((a, b) => a + b, 0) / values.length
    else if (parameter === 'Dissolved oxygen') value = Math.min(...values)
    else if (parameter === 'pH') value = values.reduce((w, v) => (Math.abs(v - 7.5) > Math.abs(w - 7.5) ? v : w))
    else value = Math.max(...values)
  }
  return { value: value === null ? null : Number(value.toFixed(2)), tests: values.length, bdl, missing }
}

function LimitLines({ parameter }: { parameter: string }) {
  const limit = CLASS_B[parameter]
  if (!limit) return null
  return (
    <>
      {limit.min !== undefined && <ReferenceLine y={limit.min} stroke={STATUS.critical} strokeDasharray="5 4" strokeWidth={1.5} ifOverflow="extendDomain" />}
      {limit.max !== undefined && <ReferenceLine y={limit.max} stroke={STATUS.critical} strokeDasharray="5 4" strokeWidth={1.5} ifOverflow="extendDomain" />}
    </>
  )
}

export function AnalyticsPage() {
  const { t, lang, scope } = useApp()
  // Load both festivals; the global filter is applied here so the festival tab can compare them.
  const readings = useLoad(() => cached<ReadingView[]>('readings:ALL', () => api.readings('ALL')), [])
  const [parameter, setParameter] = useState('Dissolved oxygen')
  const [year, setYear] = useState('all')
  const [stat, setStat] = useState<Stat>('avg')
  const [tab, setTab] = useState<Tab>('ghats')

  const meta = PARAMETERS.find((p) => p.name === parameter)!
  const name = lang === 'hi' ? meta.hi : parameter
  const short = (id: string) => (lang === 'hi' ? GHAT_SHORT[id].hi : GHAT_SHORT[id].en)
  const limit = CLASS_B[parameter]

  const rows = useMemo(
    () =>
      (readings.data ?? []).filter(
        (r) => r.parameter === parameter && (year === 'all' || r.year === Number(year)) && (scope === 'ALL' || r.festival === 'Durga'),
      ),
    [readings.data, parameter, year, scope],
  )

  const byGhat = useMemo(() => {
    const list = GHAT_ORDER.map((id) => ({ id, ghat: short(id), ...summarise(rows.filter((r) => r.ghatId === id), parameter, stat) }))
    // Worst first: lowest oxygen, otherwise highest value.
    return list.sort((a, b) => {
      if (a.value === null) return 1
      if (b.value === null) return -1
      return parameter === 'Dissolved oxygen' ? a.value - b.value : b.value - a.value
    })
  }, [rows, parameter, stat, lang])

  const years = useMemo(() => [...new Set((readings.data ?? []).map((r) => r.year))].sort(), [readings.data])
  const byYear = useMemo(
    () =>
      years.map((y) => {
        const row: Record<string, number | string | null> = { year: String(y) }
        for (const id of GHAT_ORDER) {
          row[id] = summarise(rows.filter((r) => r.ghatId === id && r.year === y), parameter, 'avg').value
        }
        return row
      }),
    [rows, years, parameter],
  )

  const festivalRows = useMemo(() => {
    const all = (readings.data ?? []).filter((r) => r.parameter === parameter && (year === 'all' || r.year === Number(year)))
    return GHAT_ORDER.map((id) => {
      const g = summarise(all.filter((r) => r.ghatId === id && r.festival === 'Ganesh'), parameter, 'avg')
      const d = summarise(all.filter((r) => r.ghatId === id && r.festival === 'Durga'), parameter, 'avg')
      return { id, ghat: short(id), ganesh: g.value, durga: d.value, ganeshTests: g.tests, durgaTests: d.tests }
    })
  }, [readings.data, parameter, year, lang])

  if (readings.error) return <ErrorBox message={readings.error} onRetry={readings.reload} />
  if (!readings.data) return <Loading />

  const statLabel = stat === 'avg' ? t('average') : t('worst')
  const limitLegend = limit ? [{ label: `${t('cpcbLimit')} (${limit.text})`, color: STATUS.critical, kind: 'dashed' as const }] : []
  const unit = meta.unit

  return (
    <div>
      <PageHeader title={t('analyticsTitle')} subtitle={t('analyticsSub')} />

      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-100 pb-5">
          <Select
            label={t('parameter')}
            value={parameter}
            onChange={setParameter}
            options={PARAMETERS.map((p) => ({ value: p.name, label: lang === 'hi' ? p.hi : p.name }))}
          />
          <Select
            label={t('year')}
            value={year}
            onChange={setYear}
            options={[{ value: 'all', label: '2023 – 2025' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
          />
          {tab === 'ghats' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">{t('statistic')}</span>
              <Segmented
                value={stat}
                onChange={setStat}
                options={[
                  { value: 'avg', label: t('average') },
                  { value: 'worst', label: t('worst') },
                ]}
              />
            </div>
          )}
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
            {scope === 'DURGA' && tab !== 'festivals' ? t('scopeDurga') : t('scopeAll')}
          </span>
        </div>

        <div className="mt-5 mb-6">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'ghats', label: t('tabGhatComparison') },
              { value: 'years', label: t('tabYearTrend') },
              { value: 'festivals', label: t('tabFestival') },
            ]}
          />
        </div>

        {tab === 'ghats' && (
          <ChartFrame
            title={t('byGhat', { stat: statLabel, parameter: name })}
            subtitle={unit}
            legend={limitLegend}
            footnote={t('bdlExcluded')}
            columns={[
              { key: 'ghat', label: t('ghat') },
              { key: 'value', label: `${statLabel}${unit ? ` (${unit})` : ''}`, numeric: true },
              { key: 'tests', label: t('tests'), numeric: true },
              { key: 'bdl', label: t('bdl'), numeric: true },
              { key: 'missing', label: t('notSampled'), numeric: true },
            ]}
            rows={byGhat.map((r) => ({ ...r, value: fmt(r.value) }))}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byGhat} margin={{ top: 20, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="ghat" interval={0} {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip unit={unit} />} />
                <LimitLines parameter={parameter} />
                <Bar dataKey="value" name={statLabel} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill={INK.secondary} formatter={(v: unknown) => fmt(v as number)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}

        {tab === 'years' && (
          <ChartFrame
            title={t('byYear', { parameter: name })}
            subtitle={unit}
            legend={[...GHAT_ORDER.map((id) => ({ label: short(id), color: ghatColor(id), kind: 'line' as const })), ...limitLegend]}
            footnote={t('bdlExcluded')}
            columns={[{ key: 'year', label: t('year') }, ...GHAT_ORDER.map((id) => ({ key: id, label: short(id), numeric: true }))]}
            rows={byYear.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? fmt(v) : v ?? '–'])))}
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={byYear} margin={{ top: 10, right: 16, bottom: 4, left: -8 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip content={<ChartTooltip unit={unit} />} />
                <LimitLines parameter={parameter} />
                {GHAT_ORDER.map((id) => (
                  <Line
                    key={id}
                    dataKey={id}
                    name={short(id)}
                    stroke={ghatColor(id)}
                    strokeWidth={2}
                    dot={{ r: 4, fill: ghatColor(id), stroke: INK.surface, strokeWidth: 2 }}
                    activeDot={{ r: 6, stroke: INK.surface, strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}

        {tab === 'festivals' && (
          <ChartFrame
            title={t('byFestival', { parameter: name })}
            subtitle={unit}
            legend={[
              { label: t('ganesh'), color: SERIES[0] },
              { label: t('durga'), color: SERIES[1] },
              ...limitLegend,
            ]}
            footnote={t('bdlExcluded')}
            columns={[
              { key: 'ghat', label: t('ghat') },
              { key: 'ganesh', label: t('ganesh'), numeric: true },
              { key: 'ganeshTests', label: `${t('ganesh')} · ${t('tests')}`, numeric: true },
              { key: 'durga', label: t('durga'), numeric: true },
              { key: 'durgaTests', label: `${t('durga')} · ${t('tests')}`, numeric: true },
            ]}
            rows={festivalRows.map((r) => ({ ...r, ganesh: fmt(r.ganesh), durga: fmt(r.durga) }))}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={festivalRows} barGap={2} margin={{ top: 10, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="ghat" interval={0} {...axisProps} />
                <YAxis {...axisProps} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip unit={unit} />} />
                <LimitLines parameter={parameter} />
                <Bar dataKey="ganesh" name={t('ganesh')} fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
                <Bar dataKey="durga" name={t('durga')} fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        )}
      </Card>
    </div>
  )
}
