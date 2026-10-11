import type { CSSProperties } from 'react'
import { Link, NavLink } from 'react-router'
import { ArrowRight, Building2, FileText, Globe, Landmark, Waves } from 'lucide-react'
import { Logo } from '../components/AppShell'
import { useApp } from '../state'

const HERO_IMAGE = '/images/hero-ghat.jpg'

/** Fades the photo into the white left side of the page. */
const photoMask: CSSProperties = {
  maskImage: 'linear-gradient(to right, transparent 0%, #000 36%)',
  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 36%)',
}

export function LandingPage() {
  const { t, lang, setLang } = useApp()

  const nav = ({ isActive }: { isActive: boolean }) =>
    `relative py-1.5 text-[15px] transition after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:transition ${
      isActive ? 'font-semibold text-ink-900 after:bg-ink-900' : 'font-medium text-slate-700 after:bg-transparent hover:text-ink-900 hover:after:bg-slate-400'
    }`

  const stats = [
    { value: 7, label: t('ghatsMonitored') },
    { value: 3, label: t('yearsOfData'), sub: t('yearsRange') },
    { value: 13, label: t('parametersTested') },
  ]

  const trust = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
      <span className="text-slate-500">{t('trustedFrom')}</span>
      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
        <span className="flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Waves className="size-4" aria-hidden />
        </span>
        {t('mppcbName')}
      </span>
      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
        <span className="flex size-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Landmark className="size-4" aria-hidden />
        </span>
        {t('cpcbName')}
      </span>
      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Building2 className="size-4" aria-hidden />
        </span>
        <span>
          <span className="text-slate-500">{t('builtFor')}</span> {t('bmcName')}
        </span>
      </span>
    </div>
  )

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-white lg:h-dvh">
      {/* The photo runs to the top, right and bottom edges and fades into the white on the left. */}
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-[63%] lg:block" style={photoMask}>
        <img src={HERO_IMAGE} alt="" aria-hidden className="h-full w-full object-cover object-[42%_center]" />
        {/* Darkens the water so the figures on it stay readable. */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink-950/65 via-ink-950/25 to-transparent" />
      </div>
      <div className="absolute inset-y-0 left-0 -z-10 hidden w-[56%] bg-linear-to-r from-white via-white/90 to-white/0 lg:block" />

      <header className="relative flex h-20 shrink-0 items-center gap-6 px-6 sm:px-10 lg:px-14">
        <Logo tagline />
        <nav className="ml-auto hidden items-center gap-9 lg:flex" aria-label="Site">
          <NavLink to="/" end className={nav}>
            {t('navHome')}
          </NavLink>
          <NavLink to="/app" end className={nav}>
            {t('navDashboard')}
          </NavLink>
          <NavLink to="/app/rankings" className={nav}>
            {t('navGhats')}
          </NavLink>
          <NavLink to="/app/evidence" className={nav}>
            {t('navReports')}
          </NavLink>
          <NavLink to="/app/about" className={nav}>
            {t('navAbout')}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-10">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/85 px-3 py-2 text-sm font-semibold text-ink-900 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:bg-white"
            aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
          >
            <Globe className="size-4" aria-hidden />
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>
          <Link to="/app" className="btn btn-primary hidden px-5 sm:inline-flex">
            {t('getStarted')}
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col px-6 sm:px-10 lg:min-h-0 lg:flex-row lg:px-14">
        <section className="flex flex-col py-6 lg:w-[48%] lg:py-0">
          <div className="flex flex-1 flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-[13px] font-semibold text-brand-800 ring-1 ring-brand-200">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
              {t('chipBhopal')} · {t('chipWater')} · {t('chipFestivals')}
            </span>

            <h1 className="mt-[3vh] text-[clamp(2.4rem,min(4vw,8vh),5.2rem)] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-900">
              {t('heroLine1')}
              <br />
              {t('heroLine2')}
              <br />
              {t('heroLine3')}
            </h1>

            <p className="mt-[2.6vh] max-w-xl text-[clamp(1rem,0.45vw_+_1.3vh,1.25rem)] leading-relaxed text-slate-700">{t('heroText')}</p>

            <div className="mt-[3.6vh] flex flex-wrap gap-3">
              <Link to="/app" className="btn btn-primary group px-6 py-3.5 text-[15px]">
                {t('viewDashboard')}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/app/brief" className="btn btn-outline px-6 py-3.5 text-[15px] text-brand-800 ring-brand-600 hover:ring-brand-700">
                <FileText className="size-4" aria-hidden />
                {t('readBrief')}
              </Link>
            </div>
          </div>

          <div className="hidden pb-7 lg:block">{trust}</div>
        </section>

        {/* Photo for small screens, where it cannot sit beside the text. */}
        <div className="relative overflow-hidden rounded-3xl lg:hidden">
          <img src={HERO_IMAGE} alt="" aria-hidden className="h-56 w-full object-cover sm:h-72" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-ink-950/70 to-transparent" />
          <dl className="absolute inset-x-0 bottom-0 grid grid-cols-3 divide-x divide-white/40 py-3 text-center text-white">
            {stats.map((s) => (
              <div key={s.label} className="px-2">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-3xl font-bold">{s.value}</dd>
                <dd className="mt-0.5 text-[11px] leading-snug">
                  {s.label}
                  {s.sub && <span className="block opacity-80">{s.sub}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Figures on the water, and the footer line under them. */}
        <div className="hidden flex-1 flex-col items-end justify-end pb-7 lg:flex">
          <dl className="grid grid-cols-3 divide-x divide-white/45 text-center text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.45)]">
            {stats.map((s) => (
              <div key={s.label} className="px-8 xl:px-10">
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-[clamp(2.2rem,1.4vw_+_2.6vh,3.6rem)] leading-none font-bold">{s.value}</dd>
                <dd className="mt-2 text-[13px] leading-snug font-medium whitespace-nowrap text-white/95">
                  {s.label}
                  {s.sub && <span className="block text-white/80">{s.sub}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs font-medium text-white/85 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">{t('footerLine')}</p>
        </div>

        <div className="space-y-3 py-6 lg:hidden">
          {trust}
          <p className="text-xs text-slate-500">{t('footerLine')}</p>
        </div>
      </main>
    </div>
  )
}
