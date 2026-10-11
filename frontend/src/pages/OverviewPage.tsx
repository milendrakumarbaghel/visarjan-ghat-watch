import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, AlertTriangle, ArrowRight, CalendarClock, ChevronRight, Database, Droplet, FileText, FlaskConical, Gauge } from 'lucide-react'
import { api } from '../api'
import { ChartFrame, ChartTooltip } from '../components/charts'
import { Card, CardHeader, ErrorBox, GhatThumb, IconTile, KpiCard, Loading, PageHeader, TierBadge, tierText } from '../components/ui'
import { INK, STATUS, TIER_COLOR, axisProps } from '../lib/chartTheme'
import { VISARJAN_DATE, daysToVisarjan, fmt } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { RankingResponse, ReadingView, YearRisk } from '../types'

export function OverviewPage() {
  const { t, scope, lang, pick } = useApp()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const trend = useLoad(() => cached<YearRisk[]>(`trend:${scope}`, () => api.trend(scope)), [scope])
  const readings = useLoad(() => cached<ReadingView[]>(`readings:${scope}`, () => api.readings(scope)), [scope])

  const error = ranking.error ?? trend.error ?? readings.error
  if (error) return <ErrorBox message={error} onRetry={() => (ranking.reload(), trend.reload(), readings.reload())} />
  if (!ranking.data || !trend.data || !readings.data) return <Loading />

  const { totals, ghats } = ranking.data
  const high = ghats.filter((g) => g.tier === 'HIGH').length
  const pct = (n: number, of: number) => (of === 0 ? 0 : Math.round((100 * n) / of))
  const days = daysToVisarjan()

  const trendRows = trend.data.map((y) => ({ year: String(y.year), high: y.high, medium: y.medium, lower: y.lower, untested: y.untested }))
  const tierLabels = {
    high: lang === 'hi' ? 'उच्च' : 'High',
    medium: lang === 'hi' ? 'मध्यम' : 'Medium',
    lower: lang === 'hi' ? 'अपेक्षाकृत कम' : 'Lower',
    untested: lang === 'hi' ? 'जाँच नहीं' : 'No test',
  }

  const meters = [
    { label: t('dissolvedOxygenShort'), n: totals.doBreaches, of: totals.doTests, word: t('belowLimit') },
    { label: 'BOD', n: totals.bodBreaches, of: totals.bodTests, word: t('aboveLimit') },
    { label: 'pH', n: totals.phBreaches, of: totals.phTests, word: t('outsideRange') },
    { label: t('keyReadingsMissing'), n: totals.keyReadingsMissing, of: totals.keyReadingsExpected, word: t('missing'), missing: true },
  ]

  return (
    <div className={ranking.loading ? 'opacity-70 transition' : 'transition'}>
      <PageHeader
        title={t('overviewTitle')}
        subtitle={t('overviewSub')}
        actions={
          <Link to="/app/brief" className="btn btn-primary">
            <FileText className="size-4" /> {t('generateBrief')}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard Icon={AlertTriangle} tone="red" value={high} label={t('highRiskGhats')} sub={t('needAttention')} />
        <KpiCard
          Icon={Droplet}
          tone="orange"
          value={`${totals.doBreaches} / ${totals.doTests}`}
          label={t('doBelow')}
          sub={<b className="text-orange-600">{pct(totals.doBreaches, totals.doTests)}%</b>}
        />
        <KpiCard
          Icon={FlaskConical}
          tone="rose"
          value={`${totals.bodBreaches} / ${totals.bodTests}`}
          label={t('bodAbove')}
          sub={<b className="text-rose-600">{pct(totals.bodBreaches, totals.bodTests)}%</b>}
        />
        <KpiCard Icon={Database} tone="blue" value={readings.data.length.toLocaleString('en-IN')} label={t('totalReadings')} sub="2023–2025" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr_0.85fr]">
        <Card className="p-5">
          <ChartFrame
            title={t('riskTrend')}
            subtitle={t('riskTrendSub')}
            legend={[
              { label: tierLabels.high, color: TIER_COLOR.HIGH },
              { label: tierLabels.medium, color: TIER_COLOR.MEDIUM },
              { label: tierLabels.lower, color: TIER_COLOR.LOW },
              { label: tierLabels.untested, color: '', kind: 'hatch' },
            ]}
            columns={[
              { key: 'year', label: t('year') },
              { key: 'high', label: tierLabels.high, numeric: true },
              { key: 'medium', label: tierLabels.medium, numeric: true },
              { key: 'lower', label: tierLabels.lower, numeric: true },
              { key: 'untested', label: tierLabels.untested, numeric: true },
            ]}
            rows={trendRows}
          >
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={trendRows} margin={{ top: 22, right: 8, bottom: 0, left: -22 }}>
                <defs>
                  <pattern id="untested" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill="#f1f5f9" />
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="4" />
                  </pattern>
                </defs>
                <CartesianGrid vertical={false} stroke={INK.grid} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis allowDecimals={false} domain={[0, 7]} {...axisProps} axisLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip />} />
                <Bar dataKey="high" name={tierLabels.high} stackId="t" fill={TIER_COLOR.HIGH} stroke={INK.surface} strokeWidth={2} maxBarSize={52} />
                <Bar dataKey="medium" name={tierLabels.medium} stackId="t" fill={TIER_COLOR.MEDIUM} stroke={INK.surface} strokeWidth={2} maxBarSize={52} />
                <Bar dataKey="lower" name={tierLabels.lower} stackId="t" fill={TIER_COLOR.LOW} stroke={INK.surface} strokeWidth={2} maxBarSize={52} />
                <Bar
                  dataKey="untested"
                  name={tierLabels.untested}
                  stackId="t"
                  fill="url(#untested)"
                  stroke={INK.surface}
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={52}
                >
                  <LabelList
                    dataKey="high"
                    position="top"
                    fontSize={11}
                    fontWeight={600}
                    fill={INK.secondary}
                    formatter={(v: unknown) => `${v} ${tierLabels.high.toLowerCase()}`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Card>

        <Card className="p-5">
          <CardHeader title={t('snapshot')} icon={<IconTile Icon={Activity} tone="teal" size="sm" />} />
          <ul className="space-y-4">
            {meters.map((m) => {
              const p = pct(m.n, m.of)
              const color = m.missing ? STATUS.neutral : p >= 50 ? STATUS.critical : p >= 20 ? STATUS.serious : STATUS.warning
              return (
                <li key={m.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{m.label}</span>
                    <span className="text-xs whitespace-nowrap text-slate-500">
                      <b className="text-slate-900">{p}%</b> {m.word} · {m.n}/{m.of}
                    </span>
                  </div>
                  <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${m.missing ? 'missing-hatch' : 'bg-slate-100'}`}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(p, 2)}%`, background: color }} />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">{t('metalsNote')}</p>
        </Card>

        <Card className="flex flex-col bg-linear-to-b from-sky-50/60 to-white p-5">
          <CardHeader title={t('deadline')} icon={<IconTile Icon={CalendarClock} tone="blue" size="sm" />} />
          <div className="text-sm text-slate-600">{t('durgaVisarjan')}</div>
          <div className="mt-1 text-[26px] leading-tight font-bold">
            {VISARJAN_DATE.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
            <Gauge className="size-4" aria-hidden />
            {days >= 0 ? `${days} ${t('daysLeft')}` : t('visarjanPassed')}
          </div>
          <Link to="/app/brief" className="btn btn-primary mt-auto w-full py-2.5 text-center whitespace-normal">
            {t('generateBrief')}
          </Link>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader
          title={t('priorityGhats')}
          icon={<IconTile Icon={AlertTriangle} tone="red" size="sm" />}
          actions={
            <Link to="/app/rankings" className="btn btn-ghost btn-sm">
              {t('viewAll')} <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {ghats.slice(0, 3).map((g) => (
            <Link
              key={g.ghatId}
              to={`/app/ghat/${g.ghatId}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <GhatThumb ghatId={g.ghatId} waterBody={g.waterBody} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink-900">
                  <span className="text-slate-400">#{g.rank}</span> {pick(g.name, g.nameHi)}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <TierBadge tier={g.tier} label={g.tierLabel} labelHi={g.tierLabelHi} />
                  <span className={`text-sm font-bold ${tierText[g.tier]}`}>
                    {fmt(g.score, 1)}
                    <span className="text-xs font-medium text-slate-400">/100</span>
                  </span>
                </div>
              </div>
              <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
