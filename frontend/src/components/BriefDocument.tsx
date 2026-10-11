import type { ReactNode } from 'react'
import { translate, type Lang } from '../i18n'
import { actionsFor, buildRecommendations } from '../lib/recommendations'
import { VISARJAN_DATE, daysToVisarjan, festivalLabel, fmt } from '../lib/ghats'
import type { GhatRisk, PlanView, Report, Scope, Totals, Tier } from '../types'

/**
 * The printable brief (A4). Shown only when printing: the "Download PDF" button opens the
 * browser's print dialog, where the officer picks "Save as PDF".
 */

const L = {
  govt: ['Government of Madhya Pradesh', 'मध्यप्रदेश शासन'],
  title: ['Durga Visarjan 2026 — Ghat Water-Quality Brief', 'दुर्गा विसर्जन 2026 — घाटों की जल-गुणवत्ता पर संक्षिप्त रिपोर्ट'],
  subtitle: ['Risk ranking of Bhopal immersion ghats against CPCB bathing-water limits', 'CPCB स्नान-जल सीमा के आधार पर भोपाल के विसर्जन घाटों का जोखिम क्रम'],
  preparedFor: ['Prepared for', 'किसके लिए'],
  bmc: ['Bhopal Municipal Corporation — Durga visarjan planning', 'नगर निगम भोपाल — दुर्गा विसर्जन योजना'],
  dataSource: ['Data source', 'आँकड़ों का स्रोत'],
  mppcb: ['MP Pollution Control Board, visarjan water-quality reports 2023–2025', 'म.प्र. प्रदूषण नियंत्रण बोर्ड, विसर्जन जल-गुणवत्ता रिपोर्ट 2023–2025'],
  standard: ['Standard used', 'प्रयुक्त मानक'],
  cpcbB: ['CPCB class B (outdoor bathing): DO ≥ 5 mg/l · BOD ≤ 3 mg/l · pH 6.5–8.5', 'CPCB श्रेणी B (बाहरी स्नान): DO ≥ 5 mg/l · BOD ≤ 3 mg/l · pH 6.5–8.5'],
  prepared: ['Prepared on', 'तैयार करने की तिथि'],
  visarjan: ['Visarjan date', 'विसर्जन तिथि'],
  daysLeft: ['days left', 'दिन शेष'],
  scope: ['Readings used', 'प्रयुक्त जाँचें'],
  scopeAll: ['All festivals (Ganesh + Durga)', 'सभी त्योहार (गणेश + दुर्गा)'],
  scopeDurga: ['Durga visarjan tests only', 'केवल दुर्गा विसर्जन की जाँचें'],
  s1: ['1. Key findings', '1. मुख्य निष्कर्ष'],
  s2: ['2. Recommended actions', '2. सुझाए गए कार्य'],
  s3: ['3. Ghat-wise risk ranking', '3. घाट-वार जोखिम क्रम'],
  s4: ['4. Why the priority ghats rank high', '4. प्राथमिकता वाले घाटों के कारण'],
  s5: ['5. Limits of this data', '5. इन आँकड़ों की सीमाएँ'],
  s6: ['6. Sources', '6. स्रोत'],
  fDo: ['Dissolved oxygen (DO) was below 5 mg/l in {n} of {of} tests ({p}%).', 'घुलित ऑक्सीजन (DO) {of} में से {n} जाँचों ({p}%) में 5 mg/l से कम रही।'],
  fBod: ['BOD was above 3 mg/l in {n} of {of} tests ({p}%).', 'बीओडी (BOD) {of} में से {n} जाँचों ({p}%) में 3 mg/l से अधिक रहा।'],
  fPh: ['pH was outside 6.5–8.5 in {n} of {of} tests.', 'पीएच {of} में से {n} जाँचों में 6.5–8.5 से बाहर रहा।'],
  fHigh: ['High-risk ghats: {list}.', 'उच्च जोखिम वाले घाट: {list}।'],
  fNoHigh: ['No ghat is in the High tier for this selection.', 'इस चयन में कोई घाट उच्च श्रेणी में नहीं है।'],
  fMissing: ['{n} of {of} key readings were not sampled. They are counted as unknown, never as clean.', '{of} में से {n} मुख्य जाँचों का नमूना नहीं लिया गया। इन्हें अज्ञात माना गया है, साफ़ नहीं।'],
  thRank: ['#', 'क्र.'],
  thGhat: ['Ghat', 'घाट'],
  thRisk: ['Risk', 'जोखिम'],
  thScore: ['Score', 'स्कोर'],
  thDo: ['DO < 5', 'DO < 5'],
  thLowDo: ['Lowest DO', 'न्यूनतम DO'],
  thBod: ['BOD > 3', 'BOD > 3'],
  thHighBod: ['Highest BOD', 'अधिकतम BOD'],
  thGaps: ['Data gaps', 'आँकड़ों की कमी'],
  thAction: ['Action', 'कार्य'],
  planned: ['Planned', 'तय'],
  suggested: ['Suggested', 'सुझाव'],
  noGap: ['None', 'नहीं'],
  noTest: ['no test', 'जाँच नहीं'],
  partial: ['partial', 'अधूरी'],
  note: ['Note', 'टिप्पणी'],
  tableNote: [
    'Tests counted out of those sampled. Tiers show priority among these 7 ghats; a “Lower” ghat can still breach the limits.',
    'जाँचें केवल लिए गए नमूनों में से गिनी गई हैं। श्रेणी इन 7 घाटों में प्राथमिकता बताती है; “अपेक्षाकृत कम” वाला घाट भी सीमा से बाहर हो सकता है।',
  ],
  limits: [
    [
      'A test that was not done is shown as missing, never as clean, and never lowers a risk score.',
      'Total coliform is part of the bathing standard but is not tested in these reports.',
      'The reports print no units; standard units are assumed.',
      'Only 4 metals were tested and CPCB class B sets no metal limits, so metals are not scored.',
      '“Rani Kamlapati ghat / Kamla Park kund” may be two places: the reports use two names.',
      'This brief compares readings with limits. It makes no health findings.',
    ],
    [
      'जो जाँच नहीं हुई उसे अनुपलब्ध दिखाया गया है, कभी साफ़ नहीं; यह जोखिम स्कोर कम नहीं करती।',
      'टोटल कोलीफॉर्म स्नान-जल मानक का हिस्सा है, पर इन रिपोर्टों में इसकी जाँच नहीं हुई।',
      'रिपोर्टों में इकाइयाँ छपी नहीं हैं; मानक इकाइयाँ मानी गई हैं।',
      'केवल 4 धातुओं की जाँच हुई और CPCB श्रेणी B में धातुओं की सीमा नहीं है, इसलिए धातुएँ स्कोर में नहीं।',
      '“रानी कमलापति घाट / कमला पार्क कुंड” दो स्थान हो सकते हैं: रिपोर्टों में दो नाम हैं।',
      'यह ब्रीफ़ केवल जाँच की तुलना सीमा से करता है। स्वास्थ्य पर कोई निष्कर्ष नहीं।',
    ],
  ],
  pages: ['pages', 'पृष्ठ'],
  reviewedBy: ['Reviewed by', 'समीक्षक'],
  designation: ['Designation', 'पद'],
  date: ['Date', 'दिनांक'],
  signature: ['Signature', 'हस्ताक्षर'],
  footer: [
    'Generated by Visarjan Ghat Watch from MPPCB visarjan reports. Every figure can be traced to its report page. Not an official publication of MPPCB or BMC.',
    'विसर्जन घाट वॉच द्वारा MPPCB विसर्जन रिपोर्टों से तैयार। हर आँकड़ा रिपोर्ट के पृष्ठ तक जाँचा जा सकता है। यह MPPCB या नगर निगम का आधिकारिक प्रकाशन नहीं है।',
  ],
} as const

type Key = Exclude<keyof typeof L, 'limits'>

const tierStyle: Record<Tier, string> = {
  HIGH: 'bg-red-600 text-white',
  MEDIUM: 'bg-amber-300 text-amber-950',
  LOW: 'bg-slate-200 text-slate-800',
}

interface Props {
  lang: Lang
  scope: Scope
  ghats: GhatRisk[]
  totals: Totals
  plans: Record<string, PlanView>
  reports: Report[]
  /** Starts this copy on a new page (used for the Hindi copy after the English one). */
  newPage?: boolean
}

function dateText(d: Date, lang: Lang) {
  return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BriefDocument({ lang, scope, ghats, totals, plans, reports, newPage = false }: Props) {
  const i = lang === 'hi' ? 1 : 0
  const tx = (key: Key, vars?: Record<string, string | number>) => {
    let s: string = L[key][i]
    for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, String(v))
    return s
  }
  const name = (g: GhatRisk) => (lang === 'hi' ? g.nameHi : g.name)
  const pct = (n: number, of: number) => (of === 0 ? 0 : Math.round((100 * n) / of))
  const high = ghats.filter((g) => g.tier === 'HIGH')
  const priority = ghats.filter((g) => g.tier !== 'LOW').slice(0, 4)
  const recs = buildRecommendations(lang, ghats, plans)
  const days = daysToVisarjan()

  return (
    <article
      lang={lang}
      data-pdf-page-start={newPage || undefined}
      className={`brief-doc bg-white text-[10.5pt] leading-snug text-slate-900 ${newPage ? 'break-before-page pt-2' : ''}`}
    >
      {/* Letterhead */}
      <header className="flex items-center gap-4 border-b-[3px] border-brand-700 pb-3">
        <img src="/images/mp-emblem.png" alt="" className="size-[22mm] shrink-0" />
        <div className="flex-1">
          <div className="text-[12pt] font-bold tracking-wide text-brand-800 uppercase">{tx('govt')}</div>
          <h1 className="mt-0.5 text-[17pt] leading-tight font-extrabold text-ink-900">{tx('title')}</h1>
          <p className="mt-0.5 text-[9.5pt] text-slate-600">{tx('subtitle')}</p>
        </div>
        <div className="shrink-0 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-right text-[8.5pt]">
          <div className="text-slate-500">{tx('visarjan')}</div>
          <div className="text-[11pt] font-bold text-ink-900">{dateText(VISARJAN_DATE, lang)}</div>
          {days >= 0 && (
            <div className="font-semibold text-brand-800">
              {days} {tx('daysLeft')}
            </div>
          )}
        </div>
      </header>

      <table className="mt-3 w-full text-[9pt]">
        <tbody>
          {[
            [tx('preparedFor'), tx('bmc')],
            [tx('dataSource'), tx('mppcb')],
            [tx('standard'), tx('cpcbB')],
            [tx('scope'), scope === 'DURGA' ? tx('scopeDurga') : tx('scopeAll')],
            [tx('prepared'), dateText(new Date(), lang)],
          ].map(([k, v]) => (
            <tr key={k}>
              <th className="w-[34mm] py-0.5 pr-3 text-left align-top font-semibold text-slate-500">{k}</th>
              <td className="py-0.5 text-slate-800">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Section title={tx('s1')}>
        <ul className="list-disc space-y-1 pl-5 marker:text-brand-700">
          <li>{tx('fDo', { n: totals.doBreaches, of: totals.doTests, p: pct(totals.doBreaches, totals.doTests) })}</li>
          <li>{tx('fBod', { n: totals.bodBreaches, of: totals.bodTests, p: pct(totals.bodBreaches, totals.bodTests) })}</li>
          <li>{tx('fPh', { n: totals.phBreaches, of: totals.phTests })}</li>
          <li>{high.length ? tx('fHigh', { list: high.map(name).join(', ') }) : tx('fNoHigh')}</li>
          <li>{tx('fMissing', { n: totals.keyReadingsMissing, of: totals.keyReadingsExpected })}</li>
        </ul>
      </Section>

      <Section title={tx('s2')}>
        <ol className="space-y-1.5">
          {recs.map((r, n) => (
            <li key={n} className="flex gap-2.5">
              <span className="flex size-[5.5mm] shrink-0 items-center justify-center rounded-full bg-brand-700 text-[8pt] font-bold text-white">
                {n + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={tx('s3')}>
        <table className="w-full border-collapse text-[8.5pt]">
          <thead>
            <tr className="bg-ink-900 text-left text-white">
              {(['thRank', 'thGhat', 'thRisk', 'thDo', 'thLowDo', 'thBod', 'thHighBod', 'thGaps', 'thAction'] as const).map((h) => (
                <th key={h} className="border border-ink-900 px-1.5 py-1 font-semibold">
                  {tx(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ghats.map((g, n) => {
              const plan = plans[g.ghatId]
              const actions = actionsFor(g, plan)
              return (
                <tr key={g.ghatId} className={`break-inside-avoid align-top ${n % 2 ? 'bg-slate-50' : ''}`}>
                  <td className="border border-slate-300 px-1.5 py-1 text-center font-bold">{g.rank}</td>
                  <td className="border border-slate-300 px-1.5 py-1">
                    <div className="font-semibold">{name(g)}</div>
                    <div className="text-[7.5pt] text-slate-500">{lang === 'hi' ? g.waterBodyHi : g.waterBody}</div>
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 whitespace-nowrap">
                    <span className={`inline-block rounded px-1.5 py-px text-[7.5pt] font-bold ${tierStyle[g.tier]}`}>
                      {lang === 'hi' ? g.tierLabelHi : g.tierLabel}
                    </span>
                    <div className="mt-0.5 text-[7.5pt] text-slate-600">
                      {tx('thScore')} {fmt(g.score, 1)}
                    </div>
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 text-center">
                    {g.dissolvedOxygen.breaches}/{g.dissolvedOxygen.tests}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 text-center">
                    {g.dissolvedOxygen.worst ? fmt(g.dissolvedOxygen.worst.value) : '–'}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 text-center">
                    {g.bod.breaches}/{g.bod.tests}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 text-center">{g.bod.worst ? fmt(g.bod.worst.value) : '–'}</td>
                  <td className="border border-slate-300 px-1.5 py-1 text-[7.5pt]">
                    {g.coverage.gaps.length === 0
                      ? tx('noGap')
                      : g.coverage.gaps
                          .map((gap) => `${festivalLabel(gap.festival, gap.year, lang)} (${gap.noTable ? tx('noTest') : tx('partial')})`)
                          .join(', ')}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-1 text-[7.5pt]">
                    <div className="font-semibold text-slate-500">{plan?.saved ? tx('planned') : tx('suggested')}:</div>
                    {actions.length ? actions.map((a) => translate(lang, a)).join(', ') : '–'}
                    {plan?.saved && plan.note && (
                      <div className="mt-0.5 italic">
                        {tx('note')}: {plan.note}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-1 text-[8pt] text-slate-500">
          DO, BOD in mg/l. {tx('tableNote')}
        </p>
      </Section>

      <Section title={tx('s4')}>
        <div className="space-y-2.5">
          {priority.map((g) => (
            <div key={g.ghatId} className="break-inside-avoid rounded-md border border-slate-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {g.rank}. {name(g)}
                </span>
                <span className={`rounded px-1.5 py-px text-[7.5pt] font-bold ${tierStyle[g.tier]}`}>
                  {lang === 'hi' ? g.tierLabelHi : g.tierLabel} · {fmt(g.score, 1)}/100
                </span>
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[9.5pt] marker:text-slate-400">
                {g.reasons
                  .filter((r) => r.tone !== 'ok')
                  .slice(0, 5)
                  .map((r, n) => (
                    <li key={n}>{lang === 'hi' ? r.hi : r.en}</li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title={tx('s5')}>
        <ul className="list-disc space-y-0.5 pl-5 marker:text-brand-700">
          {L.limits[i].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Section>

      <Section title={tx('s6')}>
        <ul className="space-y-0.5 text-[9pt]">
          {reports.map((r) => (
            <li key={r.year}>
              {r.title} ({r.pages} {tx('pages')}) — <span className="break-all text-slate-600">{r.officialUrl}</span>
            </li>
          ))}
          <li>
            CPCB water quality criteria — <span className="text-slate-600">https://cpcb.gov.in/water-quality-criteria/</span>
          </li>
        </ul>
      </Section>

      <div className="mt-6 grid break-inside-avoid grid-cols-2 gap-x-10 gap-y-5 text-[9pt]">
        {(['reviewedBy', 'designation', 'signature', 'date'] as const).map((k) => (
          <div key={k} className="border-b border-slate-400 pb-1 text-slate-500">
            {tx(k)}:
          </div>
        ))}
      </div>

      <footer className="mt-5 border-t border-slate-300 pt-2 text-[7.5pt] text-slate-500">{tx('footer')}</footer>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="mb-1.5 break-after-avoid border-l-4 border-brand-600 bg-brand-50 py-1 pl-2 text-[11.5pt] font-bold text-brand-900">
        {title}
      </h2>
      {children}
    </section>
  )
}
