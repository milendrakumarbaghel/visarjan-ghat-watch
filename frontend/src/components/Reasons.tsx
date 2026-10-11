import { useState } from 'react'
import { useApp } from '../state'
import type { Reason, Tone } from '../types'
import { SourceChip } from './ui'

const toneStyle: Record<Tone, { icon: string; className: string }> = {
  alert: { icon: '⚠', className: 'text-red-700' },
  gap: { icon: '?', className: 'text-slate-600' },
  info: { icon: 'ℹ', className: 'text-brand-700' },
  ok: { icon: '✓', className: 'text-emerald-700' },
}

export function ReasonItem({ reason, maxEvidence = 3 }: { reason: Reason; maxEvidence?: number }) {
  const { pick } = useApp()
  const [expanded, setExpanded] = useState(false)
  const style = toneStyle[reason.tone]
  const shown = expanded ? reason.evidence : reason.evidence.slice(0, maxEvidence)
  const hidden = reason.evidence.length - shown.length

  return (
    <li className="flex gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50">
      <span
        aria-hidden
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${style.className} ${
          reason.tone === 'gap' ? 'missing-hatch border-slate-300' : 'border-current'
        }`}
      >
        {style.icon}
      </span>
      <div className="min-w-0 text-sm">
        <p className={`leading-relaxed ${reason.tone === 'gap' ? 'text-slate-600 italic' : 'text-slate-800'}`}>{pick(reason.en, reason.hi)}</p>
        {reason.evidence.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {shown.map((e, i) => (
              <SourceChip key={`${e.readingId}-${i}`} source={e} />
            ))}
            {hidden > 0 && (
              <button type="button" onClick={() => setExpanded(true)} className="rounded-md px-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                +{hidden}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function ReasonList({ reasons, maxEvidence }: { reasons: Reason[]; maxEvidence?: number }) {
  return (
    <ul className="-mx-2 space-y-1">
      {reasons.map((r, i) => (
        <ReasonItem key={`${r.kind}-${i}`} reason={r} maxEvidence={maxEvidence} />
      ))}
    </ul>
  )
}
