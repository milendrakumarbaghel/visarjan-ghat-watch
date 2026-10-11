// Chart colours. Validated with the dataviz palette checker against the white card surface:
// the 7 categorical slots pass CVD and normal-vision separation in this order; slots 3-5 sit
// below 3:1 contrast, so every chart ships a table view and direct labels.

import { GHAT_ORDER } from './ghats'

export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6']

/** Colour follows the ghat, never its rank, so filtering never repaints a ghat. */
export const ghatColor = (ghatId: string) => SERIES[GHAT_ORDER.indexOf(ghatId) % SERIES.length]

/** Reserved for status meaning (risk tier, limit breach). Always paired with an icon and a label. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
  neutral: '#a8a29e',
}

export const TIER_COLOR = { HIGH: STATUS.critical, MEDIUM: STATUS.warning, LOW: STATUS.neutral } as const

export const INK = {
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  surface: '#ffffff',
  deemphasis: '#94a3b8',
}

export const axisProps = {
  stroke: INK.axis,
  tick: { fill: INK.muted, fontSize: 11 },
  tickLine: false,
} as const
