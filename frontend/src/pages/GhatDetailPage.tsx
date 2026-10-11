import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ArrowRight, Beaker, Droplet, FlaskConical, Hash, MapPin, ShieldCheck, Waves } from 'lucide-react'
import { api } from '../api'
import { ChangeBadge, yearChange } from '../components/ChangeBadge'
import { PlanEditor } from '../components/PlanEditor'
import { ReasonList } from '../components/Reasons'
import { TrendChart } from '../components/TrendChart'
import {
  ActionChip,
  Card,
  CardHeader,
  ErrorBox,
  GhatThumb,
  IconTile,
  Loading,
  Segmented,
  Select,
  StatusBadge,
  Tabs,
  TierBadge,
  tierText,
  type Tone,
} from '../components/ui'
import { CLASS_B, PARAMETERS, PHASES, festivalLabel, fmt } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { GhatDetail, ReadingStatus, ReadingView, YearRisk } from '../types'

type Tab = 'overview' | 'parameters' | 'trends' | 'evidence' | 'recommendations'

const cellStyle: Record<ReadingStatus, string> = {
  BREACH: 'bg-red-100 text-red-800 font-semibold ring-1 ring-inset ring-red-300',
  WITHIN: 'bg-emerald-50 text-emerald-800',
  BELOW_DETECTION: 'bg-sky-50 text-sky-800',
  MISSING: 'missing-hatch text-slate-600 italic',
  NO_LIMIT: 'bg-white text-slate-800 ring-1 ring-inset ring-slate-100',
}

function parseEvent(label: string) {
  const [festival, year] = label.split(' ')
  return { festival, year: Number(year) }
}

export function GhatDetailPage() {
  const { ghatId = '' } = useParams()
  const { scope, t, pick, lang } = useApp()
  const detail = useLoad(() => api.ghat(ghatId, scope), [ghatId, scope])
  const trend = useLoad(() => cached<YearRisk[]>(`trend:${scope}`, () => api.trend(scope)), [scope])
  const [tab, setTab] = useState<Tab>('overview')

  if (detail.error) return <ErrorBox message={detail.error} onRetry={detail.reload} />
  if (!detail.data) return <Loading />
  const data = detail.data
  const { risk } = data

  return (
    <div className={detail.loading ? 'opacity-70 transition' : 'transition'}>
      <Link to="/app/rankings" className="no-print btn btn-ghost btn-sm mb-3 -ml-3">
        <ArrowLeft className="size-4" /> {t('back').replace('← ', '')}
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <GhatThumb ghatId={risk.ghatId} waterBody={risk.waterBody} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{pick(risk.name, risk.nameHi)}</h1>
              <TierBadge tier={risk.tier} label={risk.tierLabel} labelHi={risk.tierLabelHi} />
              <span className={`text-xl font-bold ${tierText[risk.tier]}`}>
                {fmt(risk.score, 1)}
                <span className="text-sm font-medium text-slate-400">/100</span>
              </span>
              <ChangeBadge change={yearChange(trend.data, risk.ghatId)} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{lang === 'hi' ? risk.name : risk.nameHi}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                <MapPin className="size-3.5" aria-hidden /> {pick(risk.waterBody, risk.waterBodyHi)} · Bhopal
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1">
                <Hash className="size-3.5" aria-hidden /> {t('rank')} {risk.rank} / 7
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${
                  risk.siteMatchConfidence === 'high' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                }`}
              >
                <ShieldCheck className="size-3.5" aria-hidden /> {risk.siteMatchConfidence} {t('confidence')}
              </span>
            </div>
          </div>
        </div>

        <div className="no-print mt-6">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: t('tabOverview') },
              { value: 'parameters', label: t('tabParameters') },
              { value: 'trends', label: t('tabTrends') },
              { value: 'evidence', label: t('tabEvidence') },
              { value: 'recommendations', label: t('tabRecommendations') },
            ]}
          />
        </div>

        <div className="mt-6" key={tab}>
          {tab === 'overview' && <OverviewTab data={data} onAllParameters={() => setTab('parameters')} />}
          {tab === 'parameters' && <ParametersTab data={data} />}
          {tab === 'trends' && <TrendsTab data={data} />}
          {tab === 'evidence' && <EvidenceTab data={data} />}
          {tab === 'recommendations' && <RecommendationsTab data={data} onSaved={(p) => detail.setData({ ...data, plan: p })} />}
        </div>
      </Card>
    </div>
  )
}

function OverviewTab({ data, onAllParameters }: { data: GhatDetail; onAllParameters: () => void }) {
  const { t } = useApp()
  const years = [...new Set(data.events.map((e) => parseEvent(e).year))]
  const [year, setYear] = useState('all')
  const [phase, setPhase] = useState('all')

  const events = data.events.filter((e) => year === 'all' || parseEvent(e).year === Number(year))
  const rows = data.readings.filter((r) => (year === 'all' || r.year === Number(year)) && (phase === 'all' || r.phase === phase))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          size="sm"
          value={year}
          onChange={setYear}
          options={[{ value: 'all', label: t('allYears') }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
        <Segmented
          size="sm"
          value={phase}
          onChange={setPhase}
          options={[{ value: 'all', label: t('allPhases') }, ...PHASES.map((p) => ({ value: p, label: t(p) }))]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PARAM_CARDS.map((p) => (
          <ParamCard key={p.name} {...p} readings={rows.filter((r) => r.parameter === p.name)} />
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <TrendChart readings={data.readings} events={events} parameter="Dissolved oxygen" />
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={onAllParameters} className="btn btn-soft btn-sm">
            {t('allParameters')} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2">{t('whyRank')}</p>
        <ReasonList reasons={data.risk.reasons} maxEvidence={4} />
      </div>
    </div>
  )
}

const PARAM_CARDS: { name: string; Icon: typeof Droplet; tone: Tone }[] = [
  { name: 'Dissolved oxygen', Icon: Droplet, tone: 'red' },
  { name: 'BOD', Icon: FlaskConical, tone: 'rose' },
  { name: 'pH', Icon: Beaker, tone: 'amber' },
  { name: 'Turbidity', Icon: Waves, tone: 'violet' },
]

function ParamCard({ name, Icon, tone, readings }: { name: string; Icon: typeof Droplet; tone: Tone; readings: ReadingView[] }) {
  const { t, lang } = useApp()
  const meta = PARAMETERS.find((p) => p.name === name)!
  const limit = CLASS_B[name]
  const values = readings.map((r) => r.value).filter((v): v is number => v !== null)
  const tested = readings.filter((r) => r.status !== 'MISSING').length
  const breaches = readings.filter((r) => r.status === 'BREACH').length
  const missing = readings.filter((r) => r.status === 'MISSING').length
  const bad = breaches > 0
  const word = name === 'Dissolved oxygen' ? t('belowLimit') : name === 'BOD' ? t('aboveLimit') : t('outsideRange')

  return (
    <div className={`rounded-2xl border p-4 transition hover:shadow-lift ${bad ? 'border-red-100 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3">
        <IconTile Icon={Icon} tone={limit ? (bad ? tone : 'teal') : 'violet'} size="sm" />
        <span className="text-sm font-semibold text-slate-700">{lang === 'hi' ? meta.hi : name}</span>
      </div>
      {values.length === 0 ? (
        <div className="missing-hatch mt-3 rounded-lg px-2 py-1.5 text-sm text-slate-700">{t('noTestsInFilter')}</div>
      ) : (
        <div className={`mt-3 text-xl font-bold tracking-tight ${bad ? 'text-red-600' : 'text-ink-900'}`}>
          {fmt(Math.min(...values))} – {fmt(Math.max(...values))}
          <span className="ml-1 text-xs font-medium text-slate-400">{meta.unit}</span>
        </div>
      )}
      <div className="mt-1 text-xs text-slate-500">
        {t('limit')}: {limit ? (lang === 'hi' ? limit.textHi : limit.text) : t('noLimitSet')}
      </div>
      {limit && tested > 0 && (
        <div className={`mt-2 inline-flex rounded-md px-1.5 py-0.5 text-xs font-semibold ${bad ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {Math.round((100 * breaches) / tested)}% {word} · {breaches}/{tested}
        </div>
      )}
      {missing > 0 && (
        <div className="mt-1 text-xs text-slate-500">
          +{missing} {t('notSampled').toLowerCase()}
        </div>
      )}
    </div>
  )
}

function Cell({ reading, compact = false }: { reading: ReadingView | undefined; compact?: boolean }) {
  const { t } = useApp()
  if (!reading) {
    return (
      <div className="missing-hatch rounded px-1 py-1 text-center text-slate-500" title={t('legendMissing')}>
        —
      </div>
    )
  }
  const label =
    reading.status === 'MISSING'
      ? compact
        ? '—'
        : t('notSampled')
      : reading.status === 'BELOW_DETECTION'
        ? reading.flag ?? 'BDL'
        : reading.valueAsPrinted
  if (!reading.pdfUrl) {
    return (
      <span
        title={`${t('enteredHere')}${reading.sourceNote ? ` · ${reading.sourceNote}` : ''}`}
        className={`block rounded px-1 py-1 text-center tabular-nums ring-2 ring-violet-300 ring-inset ${cellStyle[reading.status]}`}
      >
        {label}
      </span>
    )
  }
  return (
    <a
      href={reading.pdfUrl}
      target="_blank"
      rel="noreferrer"
      title={`${reading.parameterAsPrinted}: "${reading.valueAsPrinted || '(blank)'}" · ${reading.year} report p.${reading.sourcePage} · ${reading.siteAsPrinted}`}
      className={`block rounded px-1 py-1 text-center tabular-nums hover:outline hover:outline-brand-500 ${cellStyle[reading.status]}`}
    >
      {label}
    </a>
  )
}

function CellLegend() {
  const { t } = useApp()
  const items: { status: ReadingStatus; label: string; sample: string }[] = [
    { status: 'BREACH', label: t('legendBreach'), sample: '0' },
    { status: 'WITHIN', label: t('legendWithin'), sample: '6.2' },
    { status: 'BELOW_DETECTION', label: t('legendBdl'), sample: 'BDL' },
    { status: 'MISSING', label: t('legendMissing'), sample: '—' },
    { status: 'NO_LIMIT', label: t('legendNoLimit'), sample: '38' },
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.status} className="inline-flex items-center gap-1.5">
          <span className={`inline-block min-w-8 rounded border border-slate-200 px-1 text-center ${cellStyle[i.status]}`}>{i.sample}</span>
          {i.label}
        </span>
      ))}
    </div>
  )
}

function useLookup(data: GhatDetail) {
  const find = (event: string, phase: string, parameter: string) => {
    const { festival, year } = parseEvent(event)
    return data.readings.find((r) => r.year === year && r.festival === festival && r.phase === phase && r.parameter === parameter)
  }
  const hasTable = (event: string) => {
    const { festival, year } = parseEvent(event)
    return data.readings.some((r) => r.year === year && r.festival === festival)
  }
  return { find, hasTable }
}

function ParametersTab({ data }: { data: GhatDetail }) {
  const { t, lang } = useApp()
  const { find, hasTable } = useLookup(data)
  return (
    <div>
      <h3 className="font-semibold">{t('allParameters')}</h3>
      <p className="text-sm text-slate-600">{t('allParametersHelp')}</p>
      <p className="text-xs text-slate-500">{t('unitsNote')}</p>
      <div className="mt-3">
        <CellLegend />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="sticky left-0 bg-white px-2 py-1 text-left font-medium">{t('event')}</th>
              <th className="px-2 py-1 text-left font-medium">{t('phase')}</th>
              {PARAMETERS.map((p) => (
                <th key={p.name} className="px-1 py-1 text-center font-medium" title={p.name}>
                  {lang === 'hi' ? p.hi : p.short}
                  <div className="font-normal text-slate-400">{p.unit}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.events.flatMap((event) => {
              const { festival, year } = parseEvent(event)
              if (!hasTable(event)) {
                return [
                  <tr key={event} className="border-t border-slate-100">
                    <td className="sticky left-0 bg-white px-2 py-1 whitespace-nowrap">{festivalLabel(festival, year, lang)}</td>
                    <td colSpan={PARAMETERS.length + 1} className="p-0.5">
                      <div className="missing-hatch rounded px-2 py-1 text-slate-700 italic">{t('noTable')}</div>
                    </td>
                  </tr>,
                ]
              }
              return PHASES.map((phase, i) => (
                <tr key={`${event}-${phase}`} className={i === 0 ? 'border-t border-slate-200' : ''}>
                  <td className="sticky left-0 bg-white px-2 py-0.5 whitespace-nowrap">{i === 0 ? festivalLabel(festival, year, lang) : ''}</td>
                  <td className="px-2 py-0.5 whitespace-nowrap text-slate-600">{t(phase)}</td>
                  {PARAMETERS.map((p) => (
                    <td key={p.name} className="p-0.5">
                      <Cell reading={find(event, phase, p.name)} compact />
                    </td>
                  ))}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TrendsTab({ data }: { data: GhatDetail }) {
  const { t, lang } = useApp()
  const [parameter, setParameter] = useState('BOD')
  return (
    <div className="space-y-4">
      <Select
        label={t('parameter')}
        value={parameter}
        onChange={setParameter}
        options={PARAMETERS.map((p) => ({ value: p.name, label: lang === 'hi' ? p.hi : p.name }))}
      />
      <TrendChart readings={data.readings} events={data.events} parameter={parameter} />
    </div>
  )
}

function EvidenceTab({ data }: { data: GhatDetail }) {
  const { t, lang } = useApp()
  const { find, hasTable } = useLookup(data)
  return (
    <div>
      <h3 className="font-semibold">{t('evidenceTitle')}</h3>
      <p className="text-sm text-slate-600">{t('evidenceHelp')}</p>
      <div className="mt-3">
        <CellLegend />
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {(['Dissolved oxygen', 'BOD', 'pH'] as const).map((parameter) => {
          const meta = PARAMETERS.find((p) => p.name === parameter)!
          return (
            <div key={parameter}>
              <div className="mb-1 flex items-baseline justify-between">
                <h4 className="font-medium">
                  {lang === 'hi' ? meta.hi : parameter}
                  {meta.unit && <span className="text-xs font-normal text-slate-500"> {meta.unit}</span>}
                </h4>
                <span className="text-xs text-slate-500">
                  {t('limit')}: {CLASS_B[parameter].text}
                </span>
              </div>
              <table className="w-full table-fixed border-collapse text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="w-28 py-1 text-left font-medium">{t('event')}</th>
                    {PHASES.map((p) => (
                      <th key={p} className="py-1 font-medium">
                        {t(p)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event) => {
                    const { festival, year } = parseEvent(event)
                    return (
                      <tr key={event} className="border-t border-slate-100">
                        <td className="py-1 pr-1 text-xs text-slate-700">{festivalLabel(festival, year, lang)}</td>
                        {hasTable(event) ? (
                          PHASES.map((phase) => (
                            <td key={phase} className="p-0.5">
                              <Cell reading={find(event, phase, parameter)} />
                            </td>
                          ))
                        ) : (
                          <td colSpan={3} className="p-0.5">
                            <div className="missing-hatch rounded px-2 py-1 text-center text-xs text-slate-700 italic">{t('noTable')}</div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecommendationsTab({ data, onSaved }: { data: GhatDetail; onSaved: Parameters<typeof PlanEditor>[0]['onSaved'] }) {
  const { t, pick } = useApp()
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <CardHeader title={t('suggestedActions')} />
        {data.risk.suggestedActions.length === 0 ? (
          <p className="text-sm text-slate-600">{t('noSuggestion')}</p>
        ) : (
          <ul className="space-y-3">
            {data.risk.suggestedActions.map((a) => (
              <li key={a.action} className="rounded-2xl border border-slate-200 p-4 transition hover:border-brand-200 hover:shadow-card">
                <ActionChip action={a.action} />
                <p className="mt-2 text-sm text-slate-700">{pick(a.why, a.whyHi)}</p>
              </li>
            ))}
          </ul>
        )}
        {data.risk.coverage.gaps.length > 0 && (
          <div className="mt-4 space-y-1">
            {data.risk.coverage.gaps.map((g) => (
              <div key={`${g.festival}${g.year}`} className="flex items-center gap-2 text-sm text-slate-700">
                <StatusBadge status="MISSING" /> {pick(g.en, g.hi)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
        <h3 className="font-semibold">{t('planTitle')}</h3>
        <p className="mb-3 text-xs text-slate-600">{t('planHelp')}</p>
        <PlanEditor ghat={data.risk} plan={data.plan} onSaved={onSaved} />
      </div>
    </div>
  )
}
