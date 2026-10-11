import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MapContainer, Marker, TileLayer, Tooltip as LeafletTooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowRight, Info, Layers } from 'lucide-react'
import { api } from '../api'
import { Card, ErrorBox, GhatThumb, Loading, PageHeader, Segmented, TierBadge, tierRank, tierText } from '../components/ui'
import { TIER_COLOR } from '../lib/chartTheme'
import { GHAT_PLACES, fmt } from '../lib/ghats'
import { cached, useApp, useLoad } from '../state'
import type { GhatRisk, RankingResponse, Tier } from '../types'

type Basemap = 'satellite' | 'street'

const TILES: Record<Basemap, { url: string; attribution: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
}

function pinIcon(rank: number, tier: Tier, selected: boolean) {
  const size = selected ? 40 : 32
  const text = tier === 'HIGH' ? '#fff' : '#1f2937'
  return L.divIcon({
    className: '',
    html: `<div class="ghat-pin${selected ? ' is-selected' : ''}" style="background:${TIER_COLOR[tier]};width:${size}px;height:${size}px"><span style="color:${text}">${rank}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [0, size],
  })
}

export function MapPage() {
  const { t, pick, scope, lang } = useApp()
  const ranking = useLoad(() => cached<RankingResponse>(`ranking:${scope}`, () => api.ranking(scope)), [scope])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [basemap, setBasemap] = useState<Basemap>('satellite')

  const ghats = ranking.data?.ghats ?? []
  const selected: GhatRisk | undefined = useMemo(() => ghats.find((g) => g.ghatId === selectedId) ?? ghats[0], [ghats, selectedId])

  if (ranking.error) return <ErrorBox message={ranking.error} onRetry={ranking.reload} />
  if (!ranking.data || !selected) return <Loading />

  const tierWord = (tier: Tier) =>
    lang === 'hi' ? { HIGH: 'उच्च', MEDIUM: 'मध्यम', LOW: 'अपेक्षाकृत कम' }[tier] : { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Lower' }[tier]

  return (
    <div>
      <PageHeader
        title={t('mapTitle')}
        subtitle={t('mapSub')}
        actions={
          <Segmented
            value={basemap}
            onChange={setBasemap}
            options={[
              { value: 'satellite', label: lang === 'hi' ? 'उपग्रह' : 'Satellite' },
              { value: 'street', label: lang === 'hi' ? 'सड़क' : 'Street' },
            ]}
          />
        }
      />
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          {t('mapApprox')} <span className="text-amber-700">{t('mapOffline')}</span>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden p-2">
          <div className="relative isolate h-136 overflow-hidden rounded-xl">
            <MapContainer center={[23.255, 77.405]} zoom={12} scrollWheelZoom className="h-full w-full">
              <TileLayer key={basemap} attribution={TILES[basemap].attribution} url={TILES[basemap].url} />
              {ghats.map((g) => {
                const place = GHAT_PLACES[g.ghatId]
                if (!place) return null
                return (
                  <Marker
                    key={`${g.ghatId}-${g.ghatId === selected.ghatId}`}
                    position={[place.lat, place.lng]}
                    icon={pinIcon(g.rank, g.tier, g.ghatId === selected.ghatId)}
                    eventHandlers={{ click: () => setSelectedId(g.ghatId) }}
                    keyboard
                    title={g.name}
                  >
                    <LeafletTooltip direction="top" offset={[16, -34]}>
                      #{g.rank} {pick(g.name, g.nameHi)} · {tierWord(g.tier)}
                    </LeafletTooltip>
                  </Marker>
                )
              })}
            </MapContainer>

            <div className="absolute top-3 left-14 z-500 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow ring-1 ring-slate-200">
              <Layers className="size-3.5" aria-hidden /> {basemap === 'satellite' ? (lang === 'hi' ? 'उपग्रह' : 'Satellite') : lang === 'hi' ? 'सड़क' : 'Street'}
            </div>

            <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-500 flex flex-wrap items-end justify-between gap-3">
              <div className="pointer-events-auto flex gap-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium shadow-lg ring-1 ring-slate-200">
                {(['HIGH', 'MEDIUM', 'LOW'] as const).map((tier) => (
                  <span key={tier} className="inline-flex items-center gap-1.5">
                    <span className="size-3 rounded-full ring-2 ring-white" style={{ background: TIER_COLOR[tier] }} />
                    {tierWord(tier)}
                  </span>
                ))}
              </div>
              <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl bg-white/95 p-2.5 pr-3 shadow-lg ring-1 ring-slate-200">
                <GhatThumb ghatId={selected.ghatId} waterBody={selected.waterBody} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{pick(selected.name, selected.nameHi)}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <TierBadge tier={selected.tier} label={selected.tierLabel} labelHi={selected.tierLabelHi} />
                    <span className={`text-xs font-bold ${tierText[selected.tier]}`}>{fmt(selected.score, 1)}/100</span>
                  </div>
                </div>
                <Link to={`/app/ghat/${selected.ghatId}`} className="btn btn-soft btn-sm ml-1">
                  {t('viewDetails')} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <GhatThumb ghatId={selected.ghatId} waterBody={selected.waterBody} />
              <div className="min-w-0">
                <div className="font-semibold">
                  <span className="text-slate-400">#{selected.rank}</span> {pick(selected.name, selected.nameHi)}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{pick(selected.waterBody, selected.waterBodyHi)}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{pick(selected.reasons[0]?.en ?? '', selected.reasons[0]?.hi ?? '')}</p>
          </Card>

          <Card className="overflow-hidden p-1.5">
            {ghats.map((g) => {
              const on = g.ghatId === selected.ghatId
              return (
                <button
                  key={g.ghatId}
                  type="button"
                  onClick={() => setSelectedId(g.ghatId)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    on ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${tierRank[g.tier]}`}>{g.rank}</span>
                  <span className={`flex-1 truncate ${on ? 'font-semibold text-brand-900' : 'font-medium text-slate-700'}`}>{pick(g.name, g.nameHi)}</span>
                  <span className={`text-xs font-bold ${tierText[g.tier]}`}>{fmt(g.score, 1)}</span>
                </button>
              )
            })}
          </Card>
        </div>
      </div>
    </div>
  )
}
