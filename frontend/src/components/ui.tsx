import { useState, type ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ChevronDown,
  ExternalLink,
  FlaskConical,
  Sparkles,
  Wind,
} from 'lucide-react'
import { festivalLabel } from '../lib/ghats'
import { useApp } from '../state'
import type { ActionCode, ReadingRef, ReadingStatus, Tier } from '../types'

export function Card({ children, className = '', hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** A card's title row: optional icon tile, title, subtitle and actions on the right. */
export function CardHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const tileTones = {
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  amber: 'bg-amber-100 text-amber-600',
  rose: 'bg-rose-100 text-rose-600',
  blue: 'bg-sky-100 text-sky-600',
  violet: 'bg-violet-100 text-violet-600',
  teal: 'bg-brand-100 text-brand-700',
  slate: 'bg-slate-100 text-slate-600',
} as const
export type Tone = keyof typeof tileTones

export function IconTile({ Icon, tone = 'teal', size = 'md' }: { Icon: typeof Wind; tone?: Tone; size?: 'sm' | 'md' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${tileTones[tone]} ${size === 'sm' ? 'size-8' : 'size-11'}`}>
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden />
    </span>
  )
}

const kpiTones: Record<Tone, { card: string; value: string }> = {
  red: { card: 'bg-red-50/70 border-red-100', value: 'text-red-600' },
  orange: { card: 'bg-orange-50/70 border-orange-100', value: 'text-orange-600' },
  amber: { card: 'bg-amber-50/70 border-amber-100', value: 'text-amber-600' },
  rose: { card: 'bg-rose-50/70 border-rose-100', value: 'text-rose-600' },
  blue: { card: 'bg-sky-50/70 border-sky-100', value: 'text-sky-700' },
  violet: { card: 'bg-violet-50/70 border-violet-100', value: 'text-violet-700' },
  teal: { card: 'bg-brand-50/70 border-brand-100', value: 'text-brand-700' },
  slate: { card: 'bg-slate-50 border-slate-200', value: 'text-slate-800' },
}

/** Tinted figure card, as in the design's top row. */
export function KpiCard({
  Icon,
  tone,
  value,
  label,
  sub,
}: {
  Icon: typeof Wind
  tone: Tone
  value: ReactNode
  label: string
  sub?: ReactNode
}) {
  const t = kpiTones[tone]
  return (
    <div className={`flex items-center gap-4 rounded-2xl border px-5 py-5 shadow-card transition hover:shadow-lift ${t.card}`}>
      <IconTile Icon={Icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] leading-none font-bold tracking-tight ${t.value}`}>{value}</span>
          {sub && <span className="truncate text-[13px] font-semibold text-slate-500">{sub}</span>}
        </div>
        <div className="mt-1.5 truncate text-sm font-semibold text-slate-700" title={label}>
          {label}
        </div>
      </div>
    </div>
  )
}

const tierStyle: Record<Tier, { className: string; Icon: typeof AlertTriangle }> = {
  HIGH: { className: 'bg-red-600 text-white shadow-sm shadow-red-900/20', Icon: AlertTriangle },
  MEDIUM: { className: 'bg-amber-400 text-amber-950', Icon: AlertCircle },
  LOW: { className: 'bg-slate-200 text-slate-700', Icon: ArrowDownCircle },
}

/** Risk tier: colour, icon and word together, so the tier never rests on colour alone. */
export function TierBadge({ tier, label, labelHi }: { tier: Tier; label: string; labelHi: string }) {
  const { pick, lang } = useApp()
  const { className, Icon } = tierStyle[tier]
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${className}`}>
      <Icon className="size-3.5" aria-hidden />
      {pick(label, labelHi)} {lang === 'hi' ? 'जोखिम' : 'Risk'}
    </span>
  )
}

/** Rank square, coloured by tier. */
export const tierRank: Record<Tier, string> = {
  HIGH: 'bg-red-500 text-white shadow-sm shadow-red-900/20',
  MEDIUM: 'bg-amber-400 text-amber-950',
  LOW: 'bg-white text-slate-600 ring-1 ring-slate-300',
}

/** Score text colour by tier. */
export const tierText: Record<Tier, string> = {
  HIGH: 'text-red-600',
  MEDIUM: 'text-amber-600',
  LOW: 'text-slate-700',
}

const statusStyle: Record<ReadingStatus, string> = {
  BREACH: 'bg-red-50 text-red-700 ring-red-200',
  WITHIN: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  BELOW_DETECTION: 'bg-sky-50 text-sky-700 ring-sky-200',
  MISSING: 'missing-hatch text-slate-600 ring-slate-200',
  NO_LIMIT: 'bg-slate-50 text-slate-600 ring-slate-200',
}

export function StatusBadge({ status }: { status: ReadingStatus }) {
  const { t } = useApp()
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset ${statusStyle[status]}`}>
      {t(`st${status}`)}
    </span>
  )
}

/** A clickable pointer to the report page a number came from. */
export function SourceChip({ source, showValue = true }: { source: ReadingRef; showValue?: boolean }) {
  const { t, lang } = useApp()
  const unit = source.parameter === 'pH' ? '' : ` ${source.unit ?? ''}`
  if (!source.pdfUrl) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-800 ring-1 ring-violet-200 ring-inset">
        {showValue && (
          <span className="font-semibold">
            {source.valueAsPrinted}
            {unit}
          </span>
        )}
        <span>
          {festivalLabel(source.festival, source.year, lang)} · {t(source.phase as 'pre' | 'during' | 'after')} · {t('enteredHere')}
        </span>
      </span>
    )
  }
  return (
    <a
      href={source.pdfUrl}
      target="_blank"
      rel="noreferrer"
      title={`${t('openPage')}: ${source.year} ${t('report')}, ${t('page')}${source.sourcePage}`}
      className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-200 transition ring-inset hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-300"
    >
      {showValue && (
        <span className="font-semibold text-slate-900">
          {source.valueAsPrinted}
          {unit}
        </span>
      )}
      <span>
        {festivalLabel(source.festival, source.year, lang)} · {t(source.phase as 'pre' | 'during' | 'after')} · {t('page')}
        {source.sourcePage}
      </span>
      <ExternalLink className="size-3 text-brand-600" aria-hidden />
    </a>
  )
}

const actionIcons: Record<ActionCode, typeof Wind> = { AERATION: Wind, CLEANING: Sparkles, EXTRA_TESTING: FlaskConical }

export function ActionChip({ action, muted = false }: { action: ActionCode; muted?: boolean }) {
  const { t } = useApp()
  const Icon = actionIcons[action]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
        muted ? 'border border-dashed border-slate-300 bg-white text-slate-600' : 'bg-brand-600 text-white'
      }`}
    >
      <Icon className="size-3.5" aria-hidden />
      {t(action)}
    </span>
  )
}

/** Filter pills, as in the design: the chosen one outlined in teal. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200" role="group">
      {options.map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={`rounded-lg font-semibold whitespace-nowrap transition ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]'} ${
              on ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-500' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Underline tabs, as in the design's detail and analytics pages. */
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div className="scroll-thin flex gap-6 overflow-x-auto border-b border-slate-200" role="tablist">
      {items.map((i) => {
        const on = value === i.value
        return (
          <button
            key={i.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(i.value)}
            className={`-mb-px border-b-2 pt-1 pb-3 text-sm font-semibold whitespace-nowrap transition ${
              on ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {i.label}
          </button>
        )
      })}
    </div>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  const control = (
    <span className="relative block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="field cursor-pointer appearance-none pr-9 font-medium"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </span>
  )
  if (!label) return <span className={className}>{control}</span>
  return (
    <label className={`flex min-w-40 flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {control}
    </label>
  )
}

const waterTones: Record<string, [string, string, string]> = {
  'Upper Lake': ['#1d5f93', '#5fa8d6', '#f4b183'],
  'Lower Lake': ['#0f5a5a', '#4fb3a6', '#f2a97e'],
  'Hathaikheda dam': ['#2f4f7f', '#86a5d6', '#e9b68c'],
  Kund: ['#5b3f86', '#a88bd0', '#f0b38f'],
  'Shahpura Lake': ['#7a4a1d', '#d5a066', '#f7c48e'],
}

/** Ghats with a picture in public/images/ghats/. */
const GHAT_IMAGES = new Set(['bairagarh', 'khatlapura', 'prempura', 'rani-kamlapati', 'hathaikheda', 'malikhedi', 'shahpura'])

const thumbDims = { sm: 'h-10 w-14', md: 'h-14 w-20', lg: 'h-24 w-36', xl: 'h-28 w-44 sm:h-32 sm:w-52' } as const

/**
 * The ghat's picture, or a drawn dusk-over-water scene toned by its water body when there is none
 * (or the file fails to load).
 */
export function GhatThumb({ ghatId, waterBody, size = 'md' }: { ghatId?: string; waterBody: string; size?: keyof typeof thumbDims }) {
  const [failed, setFailed] = useState(false)
  if (ghatId && GHAT_IMAGES.has(ghatId) && !failed) {
    return (
      <img
        src={`/images/ghats/${ghatId}.jpg`}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${thumbDims[size]} shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5`}
      />
    )
  }
  return <GhatIllustration waterBody={waterBody} dims={thumbDims[size]} />
}

function GhatIllustration({ waterBody, dims }: { waterBody: string; dims: string }) {
  const [deep, light, sky] = waterTones[waterBody] ?? ['#334155', '#94a3b8', '#e2c8a8']
  const id = deep.slice(1)
  return (
    <svg viewBox="0 0 80 56" className={`${dims} shrink-0 rounded-xl ring-1 ring-black/5`} aria-hidden>
      <defs>
        <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8f87c9" />
          <stop offset="0.6" stopColor={sky} />
          <stop offset="1" stopColor="#fde2c4" />
        </linearGradient>
        <linearGradient id={`w-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <rect width="80" height="56" fill={`url(#s-${id})`} />
      <circle cx="58" cy="22" r="7" fill="#fff1d0" opacity="0.85" />
      <g fill="#3a2a3c">
        <rect x="18" y="26" width="34" height="8" />
        <path d="M22 26 q13 -18 26 0z" />
        <rect x="34" y="7" width="2" height="5" />
        <path d="M12 34 q4 -7 8 0z M50 34 q4 -7 8 0z" />
        <rect x="8" y="33" width="56" height="3" />
      </g>
      <g fill="#ffd27f">
        <rect x="24" y="28" width="3" height="4" rx="1.5" />
        <rect x="30" y="28" width="3" height="4" rx="1.5" />
        <rect x="37" y="28" width="3" height="4" rx="1.5" />
        <rect x="43" y="28" width="3" height="4" rx="1.5" />
      </g>
      <rect y="36" width="80" height="20" fill={`url(#w-${id})`} />
      <g fill="#ffd27f" opacity="0.5">
        <rect x="24" y="38" width="3" height="8" rx="1.5" />
        <rect x="37" y="39" width="3" height="10" rx="1.5" />
      </g>
      <path d="M0 46 q10 -3 20 0 t20 0 t20 0 t20 0" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" fill="none" />
    </svg>
  )
}

export function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200/60" />
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useApp()
  return (
    <div className="card mx-auto my-10 max-w-xl border-red-200 p-6">
      <div className="flex items-start gap-3">
        <IconTile Icon={AlertTriangle} tone="red" />
        <div>
          <h2 className="font-semibold text-red-700">{t('errorTitle')}</h2>
          <p className="mt-1 text-sm text-slate-700">{t('errorHelp')}</p>
          <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs text-slate-500">{message}</p>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary btn-sm mt-4">
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
