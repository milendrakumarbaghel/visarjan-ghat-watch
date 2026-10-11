import { useEffect, type ReactNode } from 'react'
import { BookOpen, ChevronRight, Database, Info, Scale, ShieldAlert, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import { Card, ErrorBox, IconTile, Loading, PageHeader, Segmented } from '../components/ui'
import { cached, useApp, useLoad } from '../state'
import type { Meta, Scope } from '../types'

function Section({ id, Icon, title, children }: { id: string; Icon: typeof Info; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <IconTile Icon={Icon} tone="teal" size="sm" />
          <h2 className="text-[15px] font-semibold">{title}</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
      </Card>
    </section>
  )
}

const SECTIONS = [
  { id: 'about', Icon: Info, key: 'aboutProject' },
  { id: 'settings', Icon: SlidersHorizontal, key: 'settingsTitle' },
  { id: 'method', Icon: BookOpen, key: 'methodology' },
  { id: 'limits', Icon: ShieldAlert, key: 'limitations' },
  { id: 'sources', Icon: Database, key: 'dataSources' },
  { id: 'cpcb', Icon: Scale, key: 'cpcbTable' },
] as const

export function AboutPage() {
  const { t, pick, lang, setLang, scope, setScope } = useApp()
  const meta = useLoad(() => cached<Meta>('meta', () => api.meta()), [])

  // Arriving with #about, #method etc. scrolls to that section once the page has content.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (meta.data && id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [meta.data])

  if (meta.error) return <ErrorBox message={meta.error} onRetry={meta.reload} />
  if (!meta.data) return <Loading />
  const { method, reports, criteria } = meta.data
  const pct = (w: number) => `${Math.round(w * 100)}%`

  return (
    <div>
      <PageHeader title={t('aboutTitle')} />
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav className="h-fit lg:sticky lg:top-24" aria-label={t('aboutTitle')}>
          <Card className="p-1.5">
            {SECTIONS.map(({ id, Icon, key }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  history.replaceState(null, '', `#${id}`)
                }}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-ink-900"
              >
                <Icon className="size-4 text-slate-400 transition group-hover:text-brand-600" aria-hidden />
                <span className="flex-1">{t(key)}</span>
                <ChevronRight
                  className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  aria-hidden
                />
              </a>
            ))}
          </Card>
        </nav>
        <div className="space-y-5">
          <Section id="about" Icon={Info} title={t('aboutProject')}>
            <p>{t('aboutText')}</p>
          </Section>

          <Section id="settings" Icon={SlidersHorizontal} title={t('settingsTitle')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{t('language')}</span>
              <Segmented
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'hi', label: 'हिंदी' },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{t('defaultScope')}</span>
              <Segmented<Scope>
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'ALL', label: t('scopeAll') },
                  { value: 'DURGA', label: t('scopeDurga') },
                ]}
              />
            </div>
          </Section>

          <Section id="method" Icon={BookOpen} title={t('methodology')}>
            <p>
              {pick(
                'Readings are compared with CPCB class B, "outdoor bathing (organised)": people stand and bathe in the water at a ghat during visarjan. Limits: dissolved oxygen 5 mg/l or more, BOD 3 mg/l or less, pH 6.5 to 8.5.',
                'जाँचों की तुलना CPCB श्रेणी B, "बाहरी स्नान (संगठित)" से की गई है: विसर्जन के समय लोग घाट पर पानी में खड़े होते और स्नान करते हैं। सीमा: घुलित ऑक्सीजन 5 mg/l या अधिक, बीओडी 3 mg/l या कम, पीएच 6.5 से 8.5।',
              )}
            </p>
            <p>
              {pick(
                'Each reading gets a severity from 0 (meets the limit) to 1: oxygen 1 at 0 mg/l, BOD 1 at 12 mg/l (four times the limit), pH 1 when a full unit outside.',
                'हर जाँच को 0 (सीमा के भीतर) से 1 तक गंभीरता: ऑक्सीजन 0 mg/l पर 1, बीओडी 12 mg/l (सीमा का चार गुना) पर 1, पीएच एक पूरी इकाई बाहर होने पर 1।',
              )}
            </p>
            <p>
              {pick(
                `Score = 100 × weighted average: dissolved oxygen ${pct(method.doWeight)}, BOD ${pct(method.bodWeight)}, pH ${pct(method.phWeight)}. High from ${method.highFrom}, Medium from ${method.mediumFrom}, otherwise Lower.`,
                `स्कोर = भारित औसत × 100: घुलित ऑक्सीजन ${pct(method.doWeight)}, बीओडी ${pct(method.bodWeight)}, पीएच ${pct(method.phWeight)}। ${method.highFrom} से उच्च, ${method.mediumFrom} से मध्यम, अन्यथा अपेक्षाकृत कम।`,
              )}
            </p>
            <p>
              {pick(
                'Not-sampled tests are shown hatched as missing and never lower a score. BDL / ND counts as a very low test — not zero, not missing.',
                'जिन जाँचों का नमूना नहीं लिया गया वे धारीदार "अनुपलब्ध" दिखती हैं और स्कोर कम नहीं करतीं। BDL / ND को बहुत कम मान की जाँच माना गया है — शून्य या अनुपलब्ध नहीं।',
              )}
            </p>
          </Section>

          <Section id="limits" Icon={ShieldAlert} title={t('limitations')}>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                {pick(
                  'Total coliform is part of the bathing standard but is not tested in these reports.',
                  'टोटल कोलीफॉर्म स्नान-जल मानक का हिस्सा है, पर इन रिपोर्टों में इसकी जाँच नहीं हुई।',
                )}
              </li>
              <li>
                {pick(
                  'The reports print no units; standard units are assumed.',
                  'रिपोर्टों में इकाइयाँ छपी नहीं हैं; मानक इकाइयाँ मानी गई हैं।',
                )}
              </li>
              <li>
                {pick(
                  'Only 4 metals were tested and class B sets no metal limits, so metals are shown, not scored.',
                  'केवल 4 धातुओं की जाँच हुई और श्रेणी B में धातुओं की सीमा नहीं है, इसलिए धातुएँ दिखाई गई हैं, स्कोर में नहीं।',
                )}
              </li>
              <li>
                {pick(
                  'Bairagarh and Malikhedi have no Durga 2025 table; their Ganesh 2025 tests are during-immersion only.',
                  'बैरागढ़ और मालीखेड़ी की दुर्गा 2025 तालिका नहीं है; गणेश 2025 में केवल विसर्जन के दौरान जाँच हुई।',
                )}
              </li>
              <li>
                {pick(
                  '"Rani Kamlapati ghat / Kamla Park kund" may be two places.',
                  '"रानी कमलापति घाट / कमला पार्क कुंड" दो स्थान हो सकते हैं।',
                )}
              </li>
              <li>
                {pick('Map pins are approximate and need checking on the ground.', 'नक्शे के पिन अनुमानित हैं, मौके पर पुष्टि ज़रूरी है।')}
              </li>
              <li>
                {pick(
                  'New BMC ghats built after the NGT order have no test history, so they are not ranked.',
                  'NGT आदेश के बाद बने नए घाटों की कोई जाँच नहीं है, इसलिए वे रैंकिंग में नहीं हैं।',
                )}
              </li>
              <li>
                {pick(
                  'This tool compares readings with limits. It makes no health findings.',
                  'यह टूल केवल जाँच की तुलना सीमा से करता है, स्वास्थ्य पर कोई निष्कर्ष नहीं देता।',
                )}
              </li>
            </ul>
          </Section>

          <Section id="sources" Icon={Database} title={t('dataSources')}>
            <ul className="space-y-2">
              {reports.map((r) => (
                <li key={r.year}>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs">
                    <a className="text-brand-700 underline" href={r.localPath} target="_blank" rel="noreferrer">
                      {pick('Open local copy', 'स्थानीय प्रति खोलें')} ({r.pages} {pick('pages', 'पृष्ठ')})
                    </a>
                    {' · '}
                    <a className="text-brand-700 underline" href={r.officialUrl} target="_blank" rel="noreferrer">
                      mppcb.mp.gov.in
                    </a>
                  </div>
                </li>
              ))}
              <li>
                <div className="font-medium">CPCB {pick('water quality criteria', 'जल-गुणवत्ता मानदंड')}</div>
                <a
                  className="text-xs text-brand-700 underline"
                  href="https://cpcb.gov.in/water-quality-criteria/"
                  target="_blank"
                  rel="noreferrer"
                >
                  cpcb.gov.in/water-quality-criteria
                </a>
              </li>
            </ul>
          </Section>

          <Section id="cpcb" Icon={Scale} title={t('cpcbTable')}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1">{pick('Class', 'श्रेणी')}</th>
                  <th className="py-1">{pick('Parameter', 'मापदंड')}</th>
                  <th className="py-1">{pick('Limit', 'सीमा')}</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c) => (
                  <tr key={c.id} className={`border-t border-slate-100 ${c.waterClass === 'B' ? 'bg-brand-50 font-medium' : ''}`}>
                    <td className="py-1" title={c.designatedUse}>
                      {c.waterClass}
                    </td>
                    <td className="py-1">{c.parameter}</td>
                    <td className="py-1">
                      {c.limitType === 'min' ? '≥ ' : c.limitType === 'max' ? '≤ ' : ''}
                      {c.limitText} {c.unit ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </div>
  )
}
