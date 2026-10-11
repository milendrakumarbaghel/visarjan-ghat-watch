// Facts about the 7 ghats that the API does not hold: map positions and display order.

export interface GhatPlace {
  id: string
  lat: number
  lng: number
}

/**
 * APPROXIMATE positions, placed by hand from the place names. They are good enough to see
 * which lake a ghat sits on, not for sending a team. Verify each pin with BMC before field use
 * and set `verified` once checked.
 */
export const GHAT_PLACES: Record<string, GhatPlace & { verified: boolean }> = {
  bairagarh: { id: 'bairagarh', lat: 23.2635, lng: 77.346, verified: false },
  khatlapura: { id: 'khatlapura', lat: 23.2505, lng: 77.3995, verified: false },
  prempura: { id: 'prempura', lat: 23.228, lng: 77.372, verified: false },
  'rani-kamlapati': { id: 'rani-kamlapati', lat: 23.2515, lng: 77.393, verified: false },
  hathaikheda: { id: 'hathaikheda', lat: 23.2735, lng: 77.484, verified: false },
  malikhedi: { id: 'malikhedi', lat: 23.311, lng: 77.406, verified: false },
  shahpura: { id: 'shahpura', lat: 23.1995, lng: 77.4235, verified: false },
}

/** Fixed order used to give each ghat the same chart colour on every screen. */
export const GHAT_ORDER = ['bairagarh', 'khatlapura', 'prempura', 'rani-kamlapati', 'hathaikheda', 'malikhedi', 'shahpura']

/** Short labels for chart axes. */
export const GHAT_SHORT: Record<string, { en: string; hi: string }> = {
  bairagarh: { en: 'Bairagarh', hi: 'बैरागढ़' },
  khatlapura: { en: 'Khatlapura', hi: 'खटलापुरा' },
  prempura: { en: 'Prempura', hi: 'प्रेमपुरा' },
  'rani-kamlapati': { en: 'Rani Kamlapati', hi: 'रानी कमलापति' },
  hathaikheda: { en: 'Hathaikheda', hi: 'हथाईखेड़ा' },
  malikhedi: { en: 'Malikhedi', hi: 'मालीखेड़ी' },
  shahpura: { en: 'Shahpura', hi: 'शाहपुरा' },
}

export const VISARJAN_DATE = new Date('2026-10-20T00:00:00+05:30')

export function daysToVisarjan(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((VISARJAN_DATE.getTime() - today.getTime()) / 86_400_000)
}

export const PHASES = ['pre', 'during', 'after'] as const
export type Phase = (typeof PHASES)[number]

export const PARAMETERS: { name: string; short: string; hi: string; unit: string }[] = [
  { name: 'Dissolved oxygen', short: 'DO', hi: 'घुलित ऑक्सीजन', unit: 'mg/l' },
  { name: 'BOD', short: 'BOD', hi: 'बीओडी', unit: 'mg/l' },
  { name: 'pH', short: 'pH', hi: 'पीएच', unit: '' },
  { name: 'COD', short: 'COD', hi: 'सीओडी', unit: 'mg/l' },
  { name: 'Total solids', short: 'Total solids', hi: 'कुल ठोस', unit: 'mg/l' },
  { name: 'Dissolved solids', short: 'Dissolved solids', hi: 'घुलित ठोस', unit: 'mg/l' },
  { name: 'Suspended solids', short: 'Suspended solids', hi: 'निलंबित ठोस', unit: 'mg/l' },
  { name: 'Turbidity', short: 'Turbidity', hi: 'गंदलापन', unit: 'NTU' },
  { name: 'Conductivity', short: 'Conductivity', hi: 'चालकता', unit: 'µS/cm' },
  { name: 'Chromium', short: 'Cr', hi: 'क्रोमियम', unit: 'mg/l' },
  { name: 'Lead', short: 'Pb', hi: 'सीसा', unit: 'mg/l' },
  { name: 'Zinc', short: 'Zn', hi: 'जस्ता', unit: 'mg/l' },
  { name: 'Copper', short: 'Cu', hi: 'तांबा', unit: 'mg/l' },
]

/** CPCB class B limits for the three parameters that have one. */
export const CLASS_B: Record<string, { min?: number; max?: number; text: string; textHi: string }> = {
  'Dissolved oxygen': { min: 5, text: '≥ 5 mg/l', textHi: '≥ 5 mg/l' },
  BOD: { max: 3, text: '≤ 3 mg/l', textHi: '≤ 3 mg/l' },
  pH: { min: 6.5, max: 8.5, text: '6.5 – 8.5', textHi: '6.5 – 8.5' },
}

export function festivalLabel(festival: string, year: number, lang: 'en' | 'hi') {
  if (lang === 'en') return `${festival} ${year}`
  return `${festival === 'Durga' ? 'दुर्गा' : 'गणेश'} ${year}`
}

export const fmt = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || Number.isNaN(n) ? '–' : String(Number(n.toFixed(digits)))
