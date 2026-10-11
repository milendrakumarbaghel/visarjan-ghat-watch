import { useEffect, useState } from 'react'
import { Check, FlaskConical, Loader2, RotateCcw, Save, Sparkles, Wind } from 'lucide-react'
import { api } from '../api'
import { useApp } from '../state'
import type { ActionCode, GhatRisk, PlanRequest, PlanView } from '../types'

const ICONS: Record<ActionCode, typeof Wind> = { AERATION: Wind, CLEANING: Sparkles, EXTRA_TESTING: FlaskConical }

const ACTIONS: { code: ActionCode; field: 'aeration' | 'cleaning' | 'extraTesting' }[] = [
  { code: 'AERATION', field: 'aeration' },
  { code: 'CLEANING', field: 'cleaning' },
  { code: 'EXTRA_TESTING', field: 'extraTesting' },
]

function fromSuggestions(ghat: GhatRisk): PlanRequest {
  const has = (code: ActionCode) => ghat.suggestedActions.some((a) => a.action === code)
  return { aeration: has('AERATION'), cleaning: has('CLEANING'), extraTesting: has('EXTRA_TESTING'), note: null }
}

function fromPlan(plan: PlanView): PlanRequest {
  return { aeration: plan.aeration, cleaning: plan.cleaning, extraTesting: plan.extraTesting, note: plan.note }
}

interface Props {
  ghat: GhatRisk
  plan: PlanView | undefined
  onSaved: (plan: PlanView) => void
  compact?: boolean
}

export function PlanEditor({ ghat, plan, onSaved, compact = false }: Props) {
  const { t, pick, lang } = useApp()
  const [draft, setDraft] = useState<PlanRequest>(() => (plan?.saved ? fromPlan(plan) : fromSuggestions(ghat)))
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(plan?.saved ? fromPlan(plan) : fromSuggestions(ghat))
    setDirty(false)
  }, [plan, ghat])

  const update = (patch: Partial<PlanRequest>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setDirty(true)
  }

  const save = async () => {
    setStatus('saving')
    setError(null)
    try {
      const saved = await api.savePlan(ghat.ghatId, { ...draft, note: draft.note?.trim() || null })
      onSaved(saved)
      setStatus('idle')
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  const reset = async () => {
    setStatus('saving')
    try {
      await api.clearPlan(ghat.ghatId)
      onSaved({ ghatId: ghat.ghatId, saved: false, aeration: false, cleaning: false, extraTesting: false, note: null, updatedAt: null })
      setStatus('idle')
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    }
  }

  const suggestion = (code: ActionCode) => ghat.suggestedActions.find((a) => a.action === code)
  const savedAt = plan?.saved && plan.updatedAt
    ? new Date(plan.updatedAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="space-y-3">
      <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-2'}>
        {ACTIONS.map(({ code, field }) => {
          const s = suggestion(code)
          const Icon = ICONS[code]
          const on = draft[field]
          return (
            <label
              key={code}
              className={`group flex cursor-pointer items-start gap-2.5 rounded-xl border text-sm transition select-none ${compact ? 'px-3 py-2' : 'p-3'} ${
                on ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={(e) => update({ [field]: e.target.checked })} />
              <span
                className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                  on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-slate-400'
                }`}
                aria-hidden
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className={`inline-flex items-center gap-1.5 font-semibold ${on ? 'text-brand-900' : 'text-slate-700'}`}>
                  <Icon className="size-4" aria-hidden />
                  {t(code)}
                  {s && compact && (
                    <span className="rounded bg-white px-1 text-[10px] font-semibold tracking-wide text-brand-700 uppercase ring-1 ring-brand-200">
                      {t('suggested')}
                    </span>
                  )}
                </span>
                {s && !compact && <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{pick(s.why, s.whyHi)}</span>}
              </span>
            </label>
          )
        })}
      </div>
      <textarea
        value={draft.note ?? ''}
        onChange={(e) => update({ note: e.target.value })}
        maxLength={1000}
        rows={compact ? 1 : 2}
        placeholder={t('note')}
        className="field resize-y"
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={save} disabled={status === 'saving' || (!dirty && plan?.saved)} className="btn btn-primary btn-sm">
          {status === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {status === 'saving' ? t('saving') : t('save')}
        </button>
        {plan?.saved ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <Check className="size-3.5" /> {t('savedAt')} {savedAt}
            </span>
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
              <RotateCcw className="size-3.5" /> {t('reset')}
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-500">{t('notSavedYet')}</span>
        )}
        {error && <span className="text-xs font-medium text-red-700">{error}</span>}
      </div>
    </div>
  )
}
