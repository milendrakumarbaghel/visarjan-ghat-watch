import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { CalendarPlus, Download, FileText, FlaskConical, Info, Loader2, Send } from 'lucide-react'
import { api } from '../api'
import { FieldSheet, TEST_DATES } from '../components/FieldSheet'
import { Card, ErrorBox, GhatThumb, Loading, PageHeader, TierBadge, tierRank } from '../components/ui'
import { PDF_LAYOUT_WIDTH, buildBriefPdf, downloadBlob, sharePdf } from '../lib/briefPdf'
import { festivalLabel } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { GhatRisk, RankingResponse, ReadingView } from '../types'

/** Ghats with missing data first, then the uncertain site, then by risk rank. */
function byPriority(ghats: GhatRisk[]) {
  const key = (g: GhatRisk) => (g.coverage.gaps.length > 0 ? 0 : g.siteMatchConfidence !== 'high' ? 1 : 2)
  return [...ghats].sort((a, b) => key(a) - key(b) || a.rank - b.rank)
}

function icsDate(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** Long iCalendar lines must be folded with a leading space. */
function icsFold(line: string) {
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 70) parts.push((i ? ' ' : '') + line.slice(i, i + 70))
  return parts.join('\r\n')
}

export function SchedulePage() {
  const { t, pick, lang, scope } = useApp()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const readings = useLoad(() => cached<ReadingView[]>('readings:ALL', () => api.readings('ALL')), [])
  const plans = useLoad(() => api.plans(), [])
  const sheetsRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)

  const error = ranking.error ?? readings.error ?? plans.error
  if (error) return <ErrorBox message={error} onRetry={() => (ranking.reload(), readings.reload(), plans.reload())} />
  if (!ranking.data || !readings.data || !plans.data) return <Loading />

  const ordered = byPriority(ranking.data.ghats)
  const dateText = (d: Date) => d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  const why = (g: GhatRisk) => {
    const parts: string[] = []
    if (g.coverage.gaps.length) {
      parts.push(t('reasonGap', { list: g.coverage.gaps.map((gap) => festivalLabel(gap.festival, gap.year, lang)).join(', ') }))
    }
    if (g.siteMatchConfidence !== 'high') parts.push(t('reasonSite'))
    if (!parts.length) parts.push(t('reasonRisk', { tier: pick(g.tierLabel, g.tierLabelHi) }))
    return parts
  }

  const downloadCalendar = () => {
    const order = ordered.map((g, n) => `${n + 1}. ${pick(g.name, g.nameHi)} — ${why(g).join('; ')}`).join('\n')
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
    const events = TEST_DATES.map((d) => {
      const end = new Date(d.date.getTime() + 86_400_000)
      const label = d.phase === 'pre' ? t('testBefore') : d.phase === 'during' ? t('testDuring') : t('testAfter')
      return [
        'BEGIN:VEVENT',
        `UID:ghat-watch-${d.phase}-2026@visarjan-ghat-watch`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${icsDate(d.date)}`,
        `DTEND;VALUE=DATE:${icsDate(end)}`,
        icsFold(`SUMMARY:${icsEscape(`${t('durgaVisarjan')} 2026 — ${t('scheduleTitle')}: ${label}`)}`),
        icsFold(`DESCRIPTION:${icsEscape(`${order}\n\n${t('coliformTip')}`)}`),
        'END:VEVENT',
      ].join('\r\n')
    })
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Visarjan Ghat Watch//EN', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR'].join('\r\n')
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'Durga-Visarjan-2026-water-testing.ics')
  }

  const makeSheets = async (ghatId?: string) => {
    await document.fonts.ready
    const root = sheetsRef.current!
    const node = ghatId ? (root.querySelector(`[data-ghat="${ghatId}"]`) as HTMLElement) : root
    const name = ghatId ? `Field-sheet-${ghatId}` : 'Field-sheets-all-ghats'
    return { blob: await buildBriefPdf(node, name), fileName: `${name}-Durga-Visarjan-2026.pdf` }
  }

  const run = async (id: string, action: () => Promise<void>) => {
    setNotice(null)
    setBusy(id)
    try {
      await action()
    } catch (e) {
      const name = (e as DOMException).name
      if (name === 'NotAllowedError') setNotice({ tone: 'info', text: t('pdfShareRetry') })
      else if (name !== 'AbortError') setNotice({ tone: 'error', text: t('pdfFailed') })
    } finally {
      setBusy(null)
    }
  }

  const downloadSheets = (ghatId?: string) =>
    run(ghatId ?? 'all', async () => {
      const { blob, fileName } = await makeSheets(ghatId)
      downloadBlob(blob, fileName)
    })

  const shareSheets = () =>
    run('share', async () => {
      const { blob, fileName } = await makeSheets()
      const result = await sharePdf(blob, fileName, `${t('scheduleTitle')} — ${t('fieldSheets')}`)
      if (result === 'downloaded') setNotice({ tone: 'info', text: t('pdfAttachHint') })
    })

  const spinner = (id: string, Icon: typeof Download) =>
    busy === id ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />

  return (
    <div>
      <PageHeader
        title={t('scheduleTitle')}
        subtitle={t('scheduleSub')}
        actions={
          <>
            <button type="button" onClick={downloadCalendar} className="btn btn-outline">
              <CalendarPlus className="size-4" /> {t('addToCalendar')}
            </button>
            <button type="button" onClick={shareSheets} disabled={busy !== null} className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
              {spinner('share', Send)} {t('sharePdf')}
            </button>
            <button type="button" onClick={() => downloadSheets()} disabled={busy !== null} className="btn btn-primary">
              {spinner('all', Download)} {t('fieldSheets')}
            </button>
          </>
        }
      />

      {notice && (
        <div
          role="status"
          className={`mb-5 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm ${
            notice.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-sky-200 bg-sky-50 text-sky-900'
          }`}
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {notice.text}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {TEST_DATES.map((d) => (
          <Card key={d.phase} className="p-5">
            <div className="eyebrow">{d.phase === 'pre' ? t('testBefore') : d.phase === 'during' ? t('testDuring') : t('testAfter')}</div>
            <div className="mt-1 text-xl font-bold text-ink-900">{dateText(d.date)}</div>
            <div className="mt-0.5 text-xs text-slate-500">7 {t('ghatsCount').toLowerCase()} · 13 + coliform</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{t('priority')}</th>
                <th className="px-4 py-3 text-left">{t('ghat')}</th>
                <th className="px-4 py-3 text-left">{t('whyFirst')}</th>
                {TEST_DATES.map((d) => (
                  <th key={d.phase} className="px-4 py-3 text-left whitespace-nowrap">
                    {d.phase === 'pre' ? t('testBefore') : d.phase === 'during' ? t('testDuring') : t('testAfter')}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {ordered.map((g, n) => (
                <tr key={g.ghatId} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className={`flex size-8 items-center justify-center rounded-lg text-sm font-bold ${tierRank[g.tier]}`}>{n + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/app/ghat/${g.ghatId}`} className="flex items-center gap-3 hover:text-brand-800">
                      <GhatThumb ghatId={g.ghatId} waterBody={g.waterBody} size="sm" />
                      <span>
                        <span className="block font-semibold">{pick(g.name, g.nameHi)}</span>
                        <TierBadge tier={g.tier} label={g.tierLabel} labelHi={g.tierLabelHi} />
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {why(g).map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </td>
                  {TEST_DATES.map((d) => (
                    <td key={d.phase} className="px-4 py-3 text-xs whitespace-nowrap text-slate-700">
                      {dateText(d.date)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => downloadSheets(g.ghatId)} disabled={busy !== null} className="btn btn-soft btn-sm">
                      {spinner(g.ghatId, FileText)} {t('fieldSheet')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-xs text-slate-600">
          <p className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
            {t('coliformTip')}
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            {t('scheduleDatesNote')}
          </p>
        </div>
      </Card>

      {/* Field sheets, laid out off screen at A4 width; the PDFs are drawn from them. */}
      <div ref={sheetsRef} aria-hidden className="pointer-events-none fixed top-0 -left-[10000px] bg-white" style={{ width: PDF_LAYOUT_WIDTH }}>
        {ordered.map((g, n) => (
          <div key={g.ghatId} data-ghat={g.ghatId}>
            <FieldSheet
              ghat={g}
              plan={plans.data![g.ghatId]}
              readings={readings.data!.filter((r) => r.ghatId === g.ghatId)}
              lang={lang}
              newPage={n > 0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
