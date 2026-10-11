// Mirrors the JSON returned by the Spring Boot API (com.ghatwatch.*).

export type Scope = 'ALL' | 'DURGA'
export type Tier = 'HIGH' | 'MEDIUM' | 'LOW'
export type Tone = 'alert' | 'ok' | 'gap' | 'info'
export type ReadingStatus = 'BREACH' | 'WITHIN' | 'BELOW_DETECTION' | 'MISSING' | 'NO_LIMIT'
export type ActionCode = 'AERATION' | 'CLEANING' | 'EXTRA_TESTING'

export interface ReadingRef {
  readingId: number
  year: number
  festival: string
  phase: string
  parameter: string
  value: number | null
  valueAsPrinted: string
  unit: string | null
  sourcePage: number
  /** Null for readings typed into Ghat Watch: they have no report page. */
  pdfUrl: string | null
  fieldEntry: boolean
}

export interface ParameterSummary {
  parameter: string
  limit: string
  tests: number
  breaches: number
  missing: number
  zeroReadings: number
  meanSeverity: number
  worst: ReadingRef | null
}

export interface Reason {
  kind: string
  tone: Tone
  en: string
  hi: string
  evidence: ReadingRef[]
}

export interface SuggestedAction {
  action: ActionCode
  why: string
  whyHi: string
}

export interface EventGap {
  year: number
  festival: string
  noTable: boolean
  missing: string[]
  en: string
  hi: string
}

export interface Coverage {
  eventsExpected: number
  eventsWithData: number
  keyReadingsExpected: number
  keyReadingsPresent: number
  percent: number
  gaps: EventGap[]
}

export interface GhatRisk {
  rank: number
  ghatId: string
  name: string
  nameHi: string
  waterBody: string
  waterBodyHi: string
  siteMatchConfidence: string
  score: number
  tier: Tier
  tierLabel: string
  tierLabelHi: string
  dissolvedOxygen: ParameterSummary
  bod: ParameterSummary
  ph: ParameterSummary
  reasons: Reason[]
  suggestedActions: SuggestedAction[]
  coverage: Coverage
}

export interface Totals {
  ghats: number
  doTests: number
  doBreaches: number
  bodTests: number
  bodBreaches: number
  phTests: number
  phBreaches: number
  keyReadingsExpected: number
  keyReadingsMissing: number
}

export interface RankingResponse {
  scope: Scope
  generatedOn: string
  visarjanDate: string
  daysToVisarjan: number
  totals: Totals
  ghats: GhatRisk[]
}

export interface ReadingView {
  id: number
  ghatId: string
  year: number
  festival: string
  phase: string
  parameter: string
  value: number | null
  valueAsPrinted: string
  unit: string | null
  flag: string | null
  status: ReadingStatus
  limit: string
  sourcePage: number
  pdfUrl: string | null
  parameterAsPrinted: string
  siteAsPrinted: string
  fieldEntry: boolean
  sourceNote: string | null
}

export interface PlanView {
  ghatId: string
  saved: boolean
  aeration: boolean
  cleaning: boolean
  extraTesting: boolean
  note: string | null
  updatedAt: string | null
}

export interface GhatDetail {
  risk: GhatRisk
  note: string | null
  noteHi: string | null
  events: string[]
  readings: ReadingView[]
  plan: PlanView
}

export interface BriefResponse {
  scope: Scope
  generatedOn: string
  english: string
  hindi: string
}

export interface CpcbCriterion {
  id: number
  waterClass: string
  designatedUse: string
  parameter: string
  limitType: string
  limitText: string
  unit: string | null
}

export interface Report {
  year: number
  title: string
  pages: number
  officialUrl: string
  localPath: string
}

export interface Meta {
  criteria: CpcbCriterion[]
  reports: Report[]
  method: { doWeight: number; bodWeight: number; phWeight: number; highFrom: number; mediumFrom: number }
}

export interface PlanRequest {
  aeration: boolean
  cleaning: boolean
  extraTesting: boolean
  note: string | null
}

export interface YearRisk {
  year: number
  high: number
  medium: number
  lower: number
  /** Ghats with no key reading that year; they sit in no tier. */
  untested: number
  ghats: { ghatId: string; name: string; nameHi: string; score: number; tier: Tier; tested: boolean }[]
}

/** A reading typed into Ghat Watch after a visarjan. */
export interface FieldReading {
  id: number
  ghatId: string
  year: number
  festival: string
  phase: string
  parameter: string
  value: number | null
  flag: string | null
  valueAsEntered: string
  sourceNote: string | null
  enteredAt: string
}

export interface FieldReadingRequest {
  ghatId: string
  year: number
  festival: string
  phase: string
  sourceNote: string | null
  values: Record<string, string>
}
