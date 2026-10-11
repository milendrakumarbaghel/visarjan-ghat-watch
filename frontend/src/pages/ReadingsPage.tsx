import { useState, type FormEvent } from 'react'
import { CheckCircle2, Info, Loader2, Save, Trash2 } from 'lucide-react'
import { api } from '../api'
import { Card, CardHeader, ErrorBox, Loading, PageHeader, Segmented, Select } from '../components/ui'
import { CLASS_B, GHAT_ORDER, GHAT_SHORT, PARAMETERS, PHASES, festivalLabel } from '../lib/ghats'
import { clearCache, useApp, useLoad } from '../state'

const YEARS = ['2026', '2027', '2028']

export function ReadingsPage() {
  const { t, lang } = useApp()
  const list = useLoad(() => api.fieldReadings(), [])
  const [ghatId, setGhatId] = useState(GHAT_ORDER[0])
  const [year, setYear] = useState('2026')
  const [festival, setFestival] = useState('Durga')
  const [phase, setPhase] = useState<string>('during')
  const [sourceNote, setSourceNote] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  if (list.error) return <ErrorBox message={list.error} onRetry={list.reload} />
  if (!list.data) return <Loading />

  const ghatName = (id: string) => (lang === 'hi' ? GHAT_SHORT[id]?.hi : GHAT_SHORT[id]?.en) ?? id
  const paramName = (name: string) => {
    const p = PARAMETERS.find((x) => x.name === name)
    return lang === 'hi' ? p?.hi ?? name : name
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const saved = await api.saveFieldReadings({
        ghatId,
        year: Number(year),
        festival,
        phase,
        sourceNote: sourceNote.trim() || null,
        values,
      })
      clearCache()
      setValues({})
      setMessage({ tone: 'ok', text: t('savedReadings', { n: saved.length }) })
      list.reload()
    } catch (err) {
      setMessage({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    await api.deleteFieldReading(id)
    clearCache()
    list.reload()
  }

  return (
    <div>
      <PageHeader title={t('readingsTitle')} subtitle={t('readingsSub')} />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="flex flex-wrap items-end gap-4">
              <Select label={t('ghat')} value={ghatId} onChange={setGhatId} options={GHAT_ORDER.map((id) => ({ value: id, label: ghatName(id) }))} />
              <Select label={t('year')} value={year} onChange={setYear} options={YEARS.map((y) => ({ value: y, label: y }))} />
              <Select
                label={t('event')}
                value={festival}
                onChange={setFestival}
                options={[
                  { value: 'Durga', label: t('durga') },
                  { value: 'Ganesh', label: t('ganesh') },
                ]}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-500">{t('phase')}</span>
                <Segmented value={phase} onChange={setPhase} options={PHASES.map((p) => ({ value: p, label: t(p) }))} />
              </div>
            </div>

            <input
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              maxLength={300}
              placeholder={t('sourceNotePlaceholder')}
              className="field"
              aria-label={t('sourceNote')}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PARAMETERS.map((p) => {
                const limit = CLASS_B[p.name]
                return (
                  <label key={p.name} className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-2 text-xs font-medium text-slate-600">
                      <span>
                        {paramName(p.name)} {p.unit && <span className="text-slate-400">({p.unit})</span>}
                      </span>
                      {limit && <span className="font-semibold text-brand-700">{limit.text}</span>}
                    </span>
                    <input
                      value={values[p.name] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                      inputMode="decimal"
                      placeholder="—"
                      className="field tabular-nums"
                    />
                  </label>
                )
              })}
            </div>

            <p className="flex items-start gap-2 text-xs text-slate-500">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t('readingsHelp')}
            </p>

            {message && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                  message.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {message.tone === 'ok' && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />}
                {message.text}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {t('saveReadings')}
            </button>
          </form>
        </Card>

        <Card className="h-fit overflow-hidden">
          <div className="px-6 pt-5">
            <CardHeader title={t('enteredList')} />
          </div>
          {list.data.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-slate-500">{t('noneEntered')}</p>
          ) : (
            <div className="scroll-thin max-h-[36rem] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="border-y border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">{t('ghat')}</th>
                    <th className="px-4 py-2 text-left">{t('event')}</th>
                    <th className="px-4 py-2 text-left">{t('parameter')}</th>
                    <th className="px-4 py-2 text-right">{t('value')}</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50" title={r.sourceNote ?? ''}>
                      <td className="px-4 py-2 whitespace-nowrap">{ghatName(r.ghatId)}</td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        {festivalLabel(r.festival, r.year, lang)} · {t(r.phase as 'pre' | 'during' | 'after')}
                      </td>
                      <td className="px-4 py-2 text-xs">{paramName(r.parameter)}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.valueAsEntered}</td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" onClick={() => remove(r.id)} className="btn btn-ghost btn-sm text-red-600" aria-label={t('remove')}>
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
