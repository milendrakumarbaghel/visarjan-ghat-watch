import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { translate, type Lang, type StringKey } from './i18n'
import type { Scope } from './types'

interface AppState {
  lang: Lang
  setLang: (lang: Lang) => void
  scope: Scope
  setScope: (scope: Scope) => void
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  /** Picks the English or Hindi variant of API text. */
  pick: (en: string, hi: string) => string
}

const AppContext = createContext<AppState | null>(null)

function stored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = localStorage.getItem(key)
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => stored('ghatwatch.lang', ['en', 'hi'] as const, 'en'))
  const [scope, setScope] = useState<Scope>(() => stored('ghatwatch.scope', ['ALL', 'DURGA'] as const, 'ALL'))

  useEffect(() => {
    localStorage.setItem('ghatwatch.lang', lang)
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => localStorage.setItem('ghatwatch.scope', scope), [scope])

  const t = useCallback((key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  const pick = useCallback((en: string, hi: string) => (lang === 'hi' ? hi : en), [lang])

  return <AppContext.Provider value={{ lang, setLang, scope, setScope, t, pick }}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

// The readings never change while the app runs, so their requests are shared between screens.
const cache = new Map<string, Promise<unknown>>()

/** Forget cached readings and rankings, e.g. after new readings are typed in. */
export function clearCache() {
  cache.clear()
}

export function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    const promise = load().catch((e) => {
      cache.delete(key)
      throw e
    })
    cache.set(key, promise)
  }
  return cache.get(key) as Promise<T>
}

/**
 * Loads data for a component and reloads when the inputs change. The previous data stays on
 * screen while the next request runs (`loading` is true), so nothing flashes.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let live = true
    setError(null)
    setLoading(true)
    load()
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload, setData }
}
