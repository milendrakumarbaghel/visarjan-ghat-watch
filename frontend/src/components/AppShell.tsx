import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ClipboardPlus,
  ChevronDown,
  FileSearch,
  FileText,
  Home,
  Info,
  Languages,
  LayoutDashboard,
  ListOrdered,
  MapPinned,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '../api'
import { daysToVisarjan } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { StringKey } from '../i18n'
import type { RankingResponse } from '../types'
import { BrandMark } from './BrandMark'
import { tierRank } from './ui'

const NAV: { to: string; label: StringKey; Icon: typeof Home; end?: boolean }[] = [
  { to: '/app', label: 'navOverview', Icon: LayoutDashboard, end: true },
  { to: '/app/rankings', label: 'navRankings', Icon: ListOrdered },
  { to: '/app/map', label: 'navMap', Icon: MapPinned },
  { to: '/app/analytics', label: 'navAnalytics', Icon: BarChart3 },
  { to: '/app/evidence', label: 'navEvidence', Icon: FileSearch },
  { to: '/app/brief', label: 'navBrief', Icon: FileText },
  { to: '/app/schedule', label: 'navSchedule', Icon: CalendarCheck },
  { to: '/app/readings', label: 'navReadings', Icon: ClipboardPlus },
]

export function Logo({ dark = false, tagline = false, emblem = false }: { dark?: boolean; tagline?: boolean; emblem?: boolean }) {
  const { t } = useApp()
  return (
    <Link to="/" className="group flex items-center gap-3">
      {emblem ? (
        // Government of Madhya Pradesh seal. Contains the State Emblem of India: confirm use with the organisers / MPSeDC.
        <img src="/images/mp-emblem.png" alt={t('mpGovt')} className="size-11 shrink-0 transition group-hover:scale-105" />
      ) : (
        <BrandMark className="h-11 w-10 shrink-0 drop-shadow-md transition group-hover:scale-105" />
      )}
      <span className="leading-tight">
        <span className={`block text-[17px] font-bold tracking-tight ${dark ? 'text-white' : 'text-ink-900'}`}>{t('appName')}</span>
        <span className={`block text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{tagline ? t('tagline') : t('appNameAlt')}</span>
      </span>
    </Link>
  )
}

function navItem({ isActive }: { isActive: boolean }) {
  return `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-600 text-white shadow-md shadow-black/20 ring-1 ring-white/10'
      : 'text-slate-300 hover:bg-white/6 hover:text-white'
  }`
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useApp()
  const days = daysToVisarjan()
  return (
    <div className="scroll-thin flex h-full flex-col overflow-y-auto bg-linear-to-b from-ink-900 to-ink-950 px-4 py-6">
      <div className="px-1">
        <Logo dark emblem />
      </div>

      <p className="mt-9 mb-2 px-3 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{t('menu')}</p>
      <nav className="flex flex-col gap-1" aria-label="Main">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navItem} onClick={onNavigate}>
            <Icon className="size-4.5 shrink-0 opacity-90" aria-hidden />
            {t(label)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          to="/app/brief"
          onClick={onNavigate}
          className="block rounded-2xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
            <CalendarDays className="size-4" aria-hidden />
            {t('durgaVisarjan')}
          </div>
          <div className="mt-1.5 text-2xl font-bold text-white">
            {days >= 0 ? days : '–'}
            <span className="ml-1 text-sm font-medium text-slate-300">{t('daysLeft')}</span>
          </div>
          <div className="mt-0.5 text-xs text-slate-400">20 Oct 2026</div>
        </Link>

        <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
          <NavLink to="/app/about" className={navItem} onClick={onNavigate}>
            <Settings className="size-4.5" aria-hidden />
            {t('navSettings')}
          </NavLink>
          <Link to="/app/about#about" onClick={onNavigate} className={navItem({ isActive: false })}>
            <Info className="size-4.5" aria-hidden />
            {t('navAbout')}
          </Link>
          <Link to="/" onClick={onNavigate} className={navItem({ isActive: false })}>
            <Home className="size-4.5" aria-hidden />
            {t('navHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function GhatSearch() {
  const { t, pick, scope } = useApp()
  const navigate = useNavigate()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!ranking.data) return []
    if (!q) return ranking.data.ghats
    return ranking.data.ghats.filter((g) => `${g.name} ${g.nameHi} ${g.waterBody}`.toLowerCase().includes(q))
  }, [query, ranking.data])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    // Ctrl+K / Cmd+K focuses the search, as hinted in the box.
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', shortcut)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', shortcut)
    }
  }, [])

  const go = (id: string) => {
    navigate(`/app/ghat/${id}`)
    setQuery('')
    setOpen(false)
    input.current?.blur()
  }

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && matches[active]) {
      go(matches[active].ghatId)
    } else if (e.key === 'Escape') {
      setOpen(false)
      input.current?.blur()
    }
  }

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        ref={input}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={t('searchGhats')}
        aria-label={t('searchGhats')}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-16 pl-10 text-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-slate-400 sm:block">
        Ctrl K
      </kbd>
      {open && matches.length > 0 && (
        <div className="animate-rise absolute z-1000 mt-2 w-full overflow-hidden rounded-xl bg-white p-1 shadow-lift ring-1 ring-slate-200">
          {matches.map((g, i) => (
            <button
              key={g.ghatId}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(g.ghatId)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${i === active ? 'bg-brand-50 text-brand-900' : 'text-slate-700'}`}
            >
              <span className={`flex size-6 items-center justify-center rounded-md text-xs font-bold ${tierRank[g.tier]}`}>{g.rank}</span>
              <span className="flex-1 truncate font-medium">{pick(g.name, g.nameHi)}</span>
              <span className="text-xs text-slate-400">{pick(g.waterBody, g.waterBodyHi)}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && matches.length === 0 && (
        <div className="absolute z-1000 mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-lift ring-1 ring-slate-200">
          {t('noMatch')}
        </div>
      )}
    </div>
  )
}

export function LanguageToggle({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useApp()
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
        dark ? 'text-white ring-1 ring-white/30 hover:bg-white/10' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
      }`}
      aria-label={lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
    >
      <Languages className="size-4" aria-hidden />
      {lang === 'en' ? 'हिंदी' : 'English'}
    </button>
  )
}

function ScopeSelect() {
  const { t, scope, setScope } = useApp()
  return (
    <span className="relative">
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value as typeof scope)}
        aria-label={t('defaultScope')}
        className="cursor-pointer appearance-none rounded-xl bg-white py-2 pr-9 pl-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:ring-slate-300 focus:ring-4 focus:ring-brand-100 focus:outline-none"
      >
        <option value="ALL">{t('scopeAll')}</option>
        <option value="DURGA">{t('scopeDurga')}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </span>
  )
}

export function AppShell() {
  const { t } = useApp()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawer(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen lg:pl-68 print:pl-0">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-68 lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="no-print fixed inset-0 z-1100 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="animate-rise absolute inset-y-0 left-0 w-68 shadow-2xl">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="absolute top-6 right-3 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <header className="no-print sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-360 items-center gap-3 px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-xl p-2 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 lg:hidden"
            aria-label={t('menu')}
          >
            <Menu className="size-5" />
          </button>
          <GhatSearch />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 md:inline-flex">
              <CalendarDays className="size-4 text-slate-400" aria-hidden />
              {t('dataRange')}
            </span>
            <span className="hidden sm:block">
              <ScopeSelect />
            </span>
            <LanguageToggle />
            <Link
              to="/app/about"
              className="hidden size-10 items-center justify-center rounded-full bg-linear-to-br from-brand-100 to-sky-100 text-brand-800 ring-2 ring-white transition hover:ring-brand-200 sm:flex"
              aria-label={t('navSettings')}
            >
              <UserRound className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="flex justify-end px-4 pb-2 sm:hidden">
          <ScopeSelect />
        </div>
      </header>

      <main className="animate-rise mx-auto max-w-360 px-4 py-6 sm:px-8 print:max-w-none print:animate-none print:p-0" key={location.pathname}>
        <Outlet />
      </main>
    </div>
  )
}
