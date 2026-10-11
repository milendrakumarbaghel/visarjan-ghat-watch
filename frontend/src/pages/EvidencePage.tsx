import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { api } from '../api'
import { Card, ErrorBox, Loading, PageHeader, Select, StatusBadge } from '../components/ui'
import { GHAT_ORDER, GHAT_SHORT, PARAMETERS, PHASES, festivalLabel } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { ReadingStatus, ReadingView } from '../types'

const PAGE_SIZE = 25
const STATUSES: ReadingStatus[] = ['BREACH', 'WITHIN', 'BELOW_DETECTION', 'MISSING', 'NO_LIMIT']

export function EvidencePage() {
  const { t, lang, scope } = useApp()
  const readings = useLoad(() => cached<ReadingView[]>(`readings:${scope}`, () => api.readings(scope)), [scope])
  const [ghat, setGhat] = useState('bairagarh')
  const [parameter, setParameter] = useState('Dissolved oxygen')
  const [year, setYear] = useState('all')
  const [phase, setPhase] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<ReadingView | null>(null)

  const rows = useMemo(
    () =>
      (readings.data ?? []).filter(
        (r) =>
          (ghat === 'all' || r.ghatId === ghat) &&
          (parameter === 'all' || r.parameter === parameter) &&
          (year === 'all' || r.year === Number(year)) &&
          (phase === 'all' || r.phase === phase) &&
          (status === 'all' || r.status === status),
      ),
    [readings.data, ghat, parameter, year, phase, status],
  )

  useEffect(() => {
    setPage(0)
    setSelected(null)
  }, [ghat, parameter, year, phase, status, scope])

  useEffect(() => {
    if (!selected && rows.length > 0) setSelected(rows[0])
  }, [rows, selected])

  if (readings.error) return <ErrorBox message={readings.error} onRetry={readings.reload} />
  if (!readings.data) return <Loading />

  const years = [...new Set(readings.data.map((r) => r.year))].sort()
  const shown = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const ghatName = (id: string) => (lang === 'hi' ? GHAT_SHORT[id].hi : GHAT_SHORT[id].en)
  const paramName = (name: string) => {
    const p = PARAMETERS.find((x) => x.name === name)
    return lang === 'hi' ? p?.hi ?? name : name
  }

  return (
    <div>
      <PageHeader title={t('evidenceExplorer')} subtitle={t('evidenceSub')} />

      <Card className="mb-5 flex flex-wrap items-end gap-4 p-5">
        <Select
          label={t('ghat')}
          value={ghat}
          onChange={setGhat}
          options={[{ value: 'all', label: t('allGhats') }, ...GHAT_ORDER.map((id) => ({ value: id, label: ghatName(id) }))]}
        />
        <Select
          label={t('parameter')}
          value={parameter}
          onChange={setParameter}
          options={[{ value: 'all', label: t('allParams') }, ...PARAMETERS.map((p) => ({ value: p.name, label: lang === 'hi' ? p.hi : p.name }))]}
        />
        <Select
          label={t('year')}
          value={year}
          onChange={setYear}
          options={[{ value: 'all', label: t('allYears') }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />
        <Select
          label={t('phase')}
          value={phase}
          onChange={setPhase}
          options={[{ value: 'all', label: t('allPhases') }, ...PHASES.map((p) => ({ value: p, label: t(p) }))]}
        />
        <Select
          label={t('status')}
          value={status}
          onChange={setStatus}
          options={[{ value: 'all', label: t('allStatus') }, ...STATUSES.map((s) => ({ value: s, label: t(`st${s}`) }))]}
        />
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_27rem]">
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">{t('noRows')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('ghat')}</th>
                      <th className="px-4 py-3 text-left">{t('event')}</th>
                      <th className="px-4 py-3 text-left">{t('phase')}</th>
                      <th className="px-4 py-3 text-left">{t('parameter')}</th>
                      <th className="px-4 py-3 text-right">{t('value')}</th>
                      <th className="px-4 py-3 text-left">{t('unit')}</th>
                      <th className="px-4 py-3 text-left">{t('status')}</th>
                      <th className="px-4 py-3 text-left">{t('sourcePage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className={`cursor-pointer border-t border-slate-100 transition ${selected?.id === r.id ? 'bg-brand-50/70 shadow-[inset_3px_0_0_var(--color-brand-600)]' : 'hover:bg-slate-50'}`}
                        aria-selected={selected?.id === r.id}
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">{ghatName(r.ghatId)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{festivalLabel(r.festival, r.year, lang)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{t(r.phase as 'pre' | 'during' | 'after')}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">{paramName(r.parameter)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{r.valueAsPrinted || '–'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{r.unit ?? ''}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {!r.pdfUrl ? (
                            <span className="text-xs font-medium text-violet-700">{t('enteredHere')}</span>
                          ) : (
                          <a
                            href={r.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-brand-700 hover:underline"
                          >
                            {r.year} {t('page')}
                            {r.sourcePage} <ExternalLink className="size-3.5" />
                          </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
                <span>
                  {t('showing', {
                    from: page * PAGE_SIZE + 1,
                    to: Math.min(rows.length, (page + 1) * PAGE_SIZE),
                    total: rows.length,
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn btn-outline btn-sm"
                  >
                    {t('prev')}
                  </button>
                  <button
                    type="button"
                    disabled={(page + 1) * PAGE_SIZE >= rows.length}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-outline btn-sm"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className="h-fit overflow-hidden xl:sticky xl:top-20">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <FileText className="size-4 text-brand-700" aria-hidden />
            <h3 className="text-sm font-semibold">{t('pdfPreview')}</h3>
            {selected && <StatusBadge status={selected.status} />}
          </div>
          {selected && !selected.pdfUrl ? (
            <div className="space-y-2 px-5 py-6 text-sm text-slate-700">
              <p className="font-semibold text-violet-800">{t('enteredHere')}</p>
              <p>{t('enteredHereHelp')}</p>
              {selected.sourceNote && (
                <p className="text-xs text-slate-500">
                  {t('sourceNote')}: {selected.sourceNote}
                </p>
              )}
            </div>
          ) : selected && selected.pdfUrl ? (
            <div>
              <div className="space-y-1 px-5 py-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-900">
                  MPPCB {selected.year} · {t('page')}
                  {selected.sourcePage}
                </div>
                <div>
                  {t('printedAs')}: <span className="font-mono">{selected.parameterAsPrinted}</span> ={' '}
                  <span className="font-mono">"{selected.valueAsPrinted || ''}"</span>
                </div>
                <div className="truncate" title={selected.siteAsPrinted}>
                  {selected.siteAsPrinted}
                </div>
              </div>
              <div className="flex items-center justify-between bg-ink-900 px-3 py-2 text-[11px] font-medium text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3.5" aria-hidden /> mppcb-visarjan-{selected.year}.pdf
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white">
                  {t('page')} {selected.sourcePage}
                </span>
              </div>
              <iframe
                key={selected.pdfUrl}
                src={selected.pdfUrl}
                title={`MPPCB ${selected.year} p.${selected.sourcePage}`}
                className="h-[30rem] w-full bg-slate-700"
              />
              <a
                href={selected.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                {t('openFull')} <ExternalLink className="size-4" />
              </a>
            </div>
          ) : (
            <p className="p-6 text-sm text-slate-500">{t('pickRow')}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
