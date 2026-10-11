import type {
  BriefResponse,
  FieldReading,
  FieldReadingRequest,
  GhatDetail,
  Meta,
  PlanRequest,
  PlanView,
  RankingResponse,
  ReadingView,
  Scope,
  YearRisk,
} from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch {
      // keep the status text
    }
    throw new Error(detail)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const scopeParam = (scope: Scope) => `scope=${scope.toLowerCase()}`

export const api = {
  ranking: (scope: Scope) => request<RankingResponse>(`/api/ranking?${scopeParam(scope)}`),
  ghat: (id: string, scope: Scope) => request<GhatDetail>(`/api/ghats/${id}?${scopeParam(scope)}`),
  readings: (scope: Scope) => request<ReadingView[]>(`/api/readings?${scopeParam(scope)}`),
  trend: (scope: Scope) => request<YearRisk[]>(`/api/trend?${scopeParam(scope)}`),
  brief: (scope: Scope) => request<BriefResponse>(`/api/brief?${scopeParam(scope)}`),
  meta: () => request<Meta>('/api/meta'),
  plans: () => request<Record<string, PlanView>>('/api/plan'),
  savePlan: (id: string, body: PlanRequest) =>
    request<PlanView>(`/api/plan/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  clearPlan: (id: string) => request<void>(`/api/plan/${id}`, { method: 'DELETE' }),
  fieldReadings: () => request<FieldReading[]>('/api/field-readings'),
  saveFieldReadings: (body: FieldReadingRequest) =>
    request<FieldReading[]>('/api/field-readings', { method: 'POST', body: JSON.stringify(body) }),
  deleteFieldReading: (id: number) => request<void>(`/api/field-readings/${id}`, { method: 'DELETE' }),
  rankingCsvUrl: (scope: Scope) => `/api/ranking.csv?${scopeParam(scope)}`,
}
