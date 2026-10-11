import { Link } from 'react-router'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts'
import { ChevronRight, Download, MapPinned } from 'lucide-react'
import { api } from '../api'
import { ChangeBadge, yearChange } from '../components/ChangeBadge'
import { ActionChip, Card, ErrorBox, GhatThumb, Loading, PageHeader, TierBadge, tierRank, tierText } from '../components/ui'
import { INK, STATUS, TIER_COLOR } from '../lib/chartTheme'
import { PHASES, fmt } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { GhatRisk, PlanView, RankingResponse, ReadingView, YearRisk } from '../types'

export function RankingsPage() {
  const { t, scope } = useApp()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const readings = useLoad(() => cached<ReadingView[]>(`readings:${scope}`, () => api.readings(scope)), [scope])
  const plans = useLoad(() => api.plans(), [])
  const trend = useLoad(() => cached<YearRisk[]>(`trend:${scope}`, () => api.trend(scope)), [scope])

  if (ranking.error ?? readings.error) return <ErrorBox message={(ranking.error ?? readings.error)!} onRetry={ranking.reload} />
  if (!ranking.data || !readings.data) return <Loading />

  return (
    <div className={ranking.loading ? 'opacity-70 transition' : 'transition'}>
      <PageHeader
        title={t('rankingTitle')}
        subtitle={t('rankingSub')}
        actions={
          <>
            <a href={api.rankingCsvUrl(scope)} className="btn btn-outline">
              <Download className="size-4" /> {t('downloadCsv')}
            </a>
            <Link to="/app/map" className="btn btn-soft">
              <MapPinned className="size-4" /> {t('viewOnMap')}
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          <span>{t('tierNote')}</span>
          <span className="hidden font-semibold tracking-wide uppercase sm:block">{t('riskScore')}</span>
        </div>
        <ol className="divide-y divide-slate-100">
          {ranking.data.ghats.map((g) => (
            <li key={g.ghatId}>
              <RankRow
                ghat={g}
                readings={readings.data!.filter((r) => r.ghatId === g.ghatId)}
                plan={plans.data?.[g.ghatId]}
                change={yearChange(trend.data, g.ghatId)}
              />
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

function RankRow({
  ghat,
  readings,
  plan,
  change,
}: {
  ghat: GhatRisk
  readings: ReadingView[]
  plan: PlanView | undefined
  change: ReturnType<typeof yearChange>
}) {
  const { t, pick } = useApp()
  const tested = readings.filter((r) => r.status !== 'MISSING').length
  const gaps = ghat.coverage.gaps.length
  const lowestDo = ghat.dissolvedOxygen.worst
  const zeros = ghat.dissolvedOxygen.zeroReadings

  // Dissolved oxygen for every festival and stage in order; null where not sampled.
  const order = (r: ReadingView) => r.year * 10 + (r.festival === 'Ganesh' ? 0 : 5) + PHASES.indexOf(r.phase as (typeof PHASES)[number])
  const spark = readings
    .filter((r) => r.parameter === 'Dissolved oxygen')
    .sort((a, b) => order(a) - order(b))
    .map((r, i) => ({ i, v: r.value }))

  const planned = plan?.saved
    ? (['AERATION', 'CLEANING', 'EXTRA_TESTING'] as const).filter(
        (a) => (a === 'AERATION' && plan.aeration) || (a === 'CLEANING' && plan.cleaning) || (a === 'EXTRA_TESTING' && plan.extraTesting),
      )
    : null
  const actions = planned ?? ghat.suggestedActions.map((a) => a.action)
  const sparkColor = ghat.tier === 'LOW' ? INK.deemphasis : TIER_COLOR[ghat.tier]

  return (
    <Link
      to={`/app/ghat/${ghat.ghatId}`}
      className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-brand-50/40 md:flex-row md:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${tierRank[ghat.tier]}`}>
          {ghat.rank}
        </span>
        <GhatThumb ghatId={ghat.ghatId} waterBody={ghat.waterBody} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-ink-900 group-hover:text-brand-800">{pick(ghat.name, ghat.nameHi)}</span>
            <TierBadge tier={ghat.tier} label={ghat.tierLabel} labelHi={ghat.tierLabelHi} />
            <ChangeBadge change={change} />
            {ghat.siteMatchConfidence !== 'high' && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                {t('siteUncertain')}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>{pick(ghat.waterBody, ghat.waterBodyHi)}</span>
            <span aria-hidden>•</span>
            <span>
              {tested} {t('readings')}
            </span>
            {lowestDo && (
              <>
                <span aria-hidden>•</span>
                <span className={ghat.dissolvedOxygen.breaches > 0 ? 'font-medium text-red-600' : ''}>
                  {zeros > 0 ? `${zeros}× DO = 0 mg/l` : `${t('lowestDo')} ${fmt(lowestDo.value)} mg/l`}
                </span>
              </>
            )}
            {ghat.bod.worst && (
              <>
                <span aria-hidden>•</span>
                <span>
                  {t('highestBod')} {fmt(ghat.bod.worst.value)} mg/l
                </span>
              </>
            )}
            {gaps > 0 && (
              <>
                <span aria-hidden>•</span>
                <span className="missing-hatch rounded px-1.5 font-medium text-slate-700">
                  {gaps} {t('dataGaps')}
                </span>
              </>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {actions.map((a) => (
              <ActionChip key={a} action={a} muted={!planned} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 self-end md:self-center">
        <div className="text-right">
          <div className={`text-2xl leading-none font-bold tracking-tight ${tierText[ghat.tier]}`}>
            {fmt(ghat.score, 1)}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
          <div className="mt-1.5 h-8 w-32" title={t('doTrendSpark')} aria-label={t('doTrendSpark')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <YAxis hide domain={[0, 'dataMax']} />
                <ReferenceLine y={5} stroke={STATUS.critical} strokeOpacity={0.35} strokeDasharray="3 3" />
                <Line
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, index } = props as { cx: number; cy: number; index: number }
                    if (index !== spark.length - 1 || spark[index]?.v === null) return <g key={index} />
                    return <circle key={index} cx={cx} cy={cy} r={4} fill={sparkColor} stroke={INK.surface} strokeWidth={2} />
                  }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
      </div>
    </Link>
  )
}
