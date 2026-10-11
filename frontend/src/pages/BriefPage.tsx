import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Copy, Download, Info, Lightbulb, Loader2, Printer, RefreshCw, Send } from 'lucide-react'
import { api } from '../api'
import { BriefDocument } from '../components/BriefDocument'
import { PlanEditor } from '../components/PlanEditor'
import { Card, CardHeader, ErrorBox, IconTile, Loading, PageHeader, Tabs, TierBadge } from '../components/ui'
import { PDF_LAYOUT_WIDTH, buildBriefPdf, downloadBlob } from '../lib/briefPdf'
import { buildRecommendations } from '../lib/recommendations'
import { cached, useApp, useLoad } from '../state'
import type { Meta, PlanView, RankingResponse } from '../types'

type BriefLang = 'en' | 'hi' | 'both'

interface PdfState {
  key: string
  blob: Blob | null
  building: boolean
}

export function BriefPage() {
  const { scope, t, pick, lang } = useApp()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const plans = useLoad(() => api.plans(), [])
  const brief = useLoad(() => api.brief(scope), [scope])
  const meta = useLoad(() => cached<Meta>('meta', () => api.meta()), [])
  const [briefLang, setBriefLang] = useState<BriefLang>(lang === 'hi' ? 'hi' : 'en')
  const [copied, setCopied] = useState(false)
  const [pdf, setPdf] = useState<PdfState>({ key: '', blob: null, building: false })
  const [busy, setBusy] = useState<'share' | 'download' | null>(null)
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const docRef = useRef<HTMLDivElement>(null)

  const ready = Boolean(ranking.data && plans.data && meta.data)
  const pdfKey = `${scope}|${briefLang}|${JSON.stringify(plans.data ?? {})}`
  const langLabel = briefLang === 'hi' ? 'Hindi' : briefLang === 'both' ? 'English-Hindi' : 'English'
  const fileName = `Durga-Visarjan-Ghat-Brief-${langLabel}-${new Date().toISOString().slice(0, 10)}.pdf`

  const makePdf = async () => {
    await document.fonts.ready
    return buildBriefPdf(docRef.current!, fileName.replace(/\.pdf$/, ''))
  }

  // Build the PDF in the background whenever its content changes, so sharing opens at once.
  useEffect(() => {
    if (!ready || !docRef.current) return
    let live = true
    setPdf({ key: pdfKey, blob: null, building: true })
    const timer = setTimeout(async () => {
      try {
        const blob = await makePdf()
        if (live) setPdf({ key: pdfKey, blob, building: false })
      } catch {
        if (live) setPdf({ key: pdfKey, blob: null, building: false })
      }
    }, 600)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [ready, pdfKey])

  const currentPdf = async () => (pdf.key === pdfKey && pdf.blob ? pdf.blob : makePdf())

  const downloadPdf = async () => {
    setNotice(null)
    setBusy('download')
    try {
      downloadBlob(await currentPdf(), fileName)
    } catch {
      setNotice({ tone: 'error', text: t('pdfFailed') })
    } finally {
      setBusy(null)
    }
  }

  const sharePdf = async () => {
    setNotice(null)
    setBusy('share')
    let blob: Blob
    try {
      blob = await currentPdf()
    } catch {
      setNotice({ tone: 'error', text: t('pdfFailed') })
      setBusy(null)
      return
    }
    const file = new File([blob], fileName, { type: 'application/pdf' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        // Opens the phone or Windows share menu; choose WhatsApp there.
        await navigator.share({ files: [file], title: fileName.replace(/\.pdf$/, ''), text: t('whatsappMsg') })
      } else {
        // This browser cannot hand files to other apps: save the PDF and open WhatsApp to attach it.
        downloadBlob(blob, fileName)
        window.open(`https://wa.me/?text=${encodeURIComponent(t('whatsappMsg'))}`, '_blank', 'noopener')
        setNotice({ tone: 'info', text: t('pdfAttachHint') })
      }
    } catch (e) {
      const name = (e as DOMException).name
      if (name === 'NotAllowedError') setNotice({ tone: 'info', text: t('pdfShareRetry') })
      else if (name !== 'AbortError') setNotice({ tone: 'error', text: t('pdfFailed') })
    } finally {
      setBusy(null)
    }
  }

  const print = () => {
    const previous = document.title
    document.title = fileName.replace(/\.pdf$/, '')
    window.addEventListener('afterprint', () => (document.title = previous), { once: true })
    window.print()
  }

  const error = ranking.error ?? plans.error ?? brief.error
  if (error) return <ErrorBox message={error} onRetry={() => (ranking.reload(), plans.reload(), brief.reload())} />
  if (!ranking.data || !plans.data) return <Loading />

  const ghats = ranking.data.ghats
  const planMap = plans.data
  const recs = buildRecommendations(lang, ghats, planMap)

  const onSaved = (p: PlanView) => {
    plans.setData({ ...planMap, [p.ghatId]: p })
    brief.reload()
  }

  const text = !brief.data
    ? ''
    : briefLang === 'en'
      ? brief.data.english
      : briefLang === 'hi'
        ? brief.data.hindi
        : `${brief.data.english}\n\n— — —\n\n${brief.data.hindi}`

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const docProps = { scope, ghats, totals: ranking.data.totals, plans: planMap, reports: meta.data?.reports ?? [] }
  const preparing = pdf.building && pdf.key === pdfKey

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title={t('briefPageTitle')}
          subtitle={t('briefPageSub')}
          actions={
            <>
              <button type="button" onClick={sharePdf} disabled={busy !== null || !ready} className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                {busy === 'share' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {t('sharePdf')}
              </button>
              <button type="button" onClick={downloadPdf} disabled={busy !== null || !ready} className="btn btn-primary">
                {busy === 'download' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} {t('downloadPdf')}
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

        <Card className="mb-5 p-6">
          <CardHeader title={t('keyRecs')} icon={<IconTile Icon={Lightbulb} tone="amber" size="sm" />} />
          <ol className="space-y-1">
            {recs.map((r, i) => (
              <li key={i} className="flex gap-3 rounded-xl px-2 py-2 text-sm leading-relaxed text-slate-700 transition hover:bg-slate-50">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          <Card>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-[15px] font-semibold">{t('planHeading')}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{t('planHelp')}</p>
            </div>
            <div className="divide-y divide-slate-100">
              {ghats.map((g) => (
                <div key={g.ghatId} className="space-y-3 px-6 py-4 transition hover:bg-slate-50/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-400">#{g.rank}</span>
                    <Link to={`/app/ghat/${g.ghatId}`} className="font-medium hover:underline">
                      {pick(g.name, g.nameHi)}
                    </Link>
                    <TierBadge tier={g.tier} label={g.tierLabel} labelHi={g.tierLabelHi} />
                  </div>
                  <PlanEditor ghat={g} plan={planMap[g.ghatId]} onSaved={onSaved} compact />
                </div>
              ))}
            </div>
          </Card>

          <Card className="h-fit p-6 xl:sticky xl:top-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <Tabs
                value={briefLang}
                onChange={setBriefLang}
                items={[
                  { value: 'en', label: t('englishBrief') },
                  { value: 'hi', label: t('hindiBrief') },
                  { value: 'both', label: t('both') },
                ]}
              />
              <button type="button" onClick={brief.reload} className="btn btn-ghost btn-sm mb-2">
                <RefreshCw className={`size-4 ${brief.loading ? 'animate-spin' : ''}`} /> {t('refresh')}
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-500">{t('briefHelp')}</p>
            {brief.data ? (
              <pre className="scroll-thin max-h-136 overflow-y-auto rounded-2xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-5 font-sans text-[13.5px] leading-relaxed whitespace-pre-wrap text-slate-800">
                {text}
              </pre>
            ) : (
              <Loading />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={sharePdf} disabled={busy !== null || !ready} className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                {busy === 'share' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {t('sharePdf')}
              </button>
              <button type="button" onClick={downloadPdf} disabled={busy !== null || !ready} className="btn btn-outline">
                <Download className="size-4" /> {t('downloadPdf')}
              </button>
              <button type="button" onClick={print} className="btn btn-outline">
                <Printer className="size-4" /> {t('print')}
              </button>
              <button type="button" onClick={copy} className="btn btn-ghost">
                <Copy className="size-4" /> {copied ? t('copied') : t('copyText')}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              {preparing ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Info className="size-3.5" aria-hidden />}
              {preparing ? t('preparingPdf') : t('shareHelp')}
            </p>
          </Card>
        </div>
      </div>

      {/*
        The formatted brief. Off screen while browsing (the PDF is drawn from it at A4 width);
        it is also the only thing that prints.
      */}
      <div
        ref={docRef}
        aria-hidden
        className="pointer-events-none fixed top-0 -left-[10000px] bg-white print:pointer-events-auto print:static print:w-auto!"
        style={{ width: PDF_LAYOUT_WIDTH }}
      >
        {briefLang !== 'hi' && <BriefDocument lang="en" {...docProps} />}
        {briefLang !== 'en' && <BriefDocument lang="hi" newPage={briefLang === 'both'} {...docProps} />}
      </div>
    </>
  )
}
