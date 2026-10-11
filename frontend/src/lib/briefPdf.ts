import { getFontEmbedCSS, toCanvas } from 'html-to-image'
import { jsPDF } from 'jspdf'

/**
 * Turns the rendered brief (BriefDocument) into an A4 PDF file in the browser.
 *
 * The brief is drawn as images rather than PDF text so that Hindi (Devanagari) is shaped
 * exactly as the browser shows it; PDF text libraries cannot shape Devanagari correctly.
 * Pages are cut only at the edges of sections, table rows and list items, never through a line.
 */

const PAGE_W = 210
const PAGE_H = 297
const MARGIN_X = 12
const MARGIN_TOP = 12
const FOOTER_SPACE = 14
const CONTENT_W = PAGE_W - 2 * MARGIN_X
const CONTENT_H = PAGE_H - MARGIN_TOP - FOOTER_SPACE

/** Width the brief is laid out at, in CSS pixels: the A4 content width at 96 dpi. */
export const PDF_LAYOUT_WIDTH = Math.round((CONTENT_W / 25.4) * 96)

let fontCss: Promise<string> | null = null

function pageBreaks(node: HTMLElement, pageHeight: number): [number, number][] {
  const top = node.getBoundingClientRect().top
  const total = node.scrollHeight
  const forced = [...node.querySelectorAll('[data-pdf-page-start]')]
    .map((el) => el.getBoundingClientRect().top - top)
    .filter((y) => y > 1)
    .sort((a, b) => a - b)
  const safe = [...node.querySelectorAll('header, section, h2, p, li, tr, table, footer, [data-pdf-block]')]
    .map((el) => Math.ceil(el.getBoundingClientRect().bottom - top))
    .sort((a, b) => a - b)

  const pages: [number, number][] = []
  let start = 0
  while (start < total - 1) {
    const limit = start + pageHeight
    const nextForced = forced.find((y) => y > start + 1)
    if (nextForced !== undefined && nextForced <= limit) {
      pages.push([start, nextForced])
      start = nextForced
      continue
    }
    if (limit >= total) {
      pages.push([start, total])
      break
    }
    const fits = safe.filter((y) => y > start + pageHeight * 0.4 && y <= limit)
    const end = fits.length ? fits[fits.length - 1] : limit
    pages.push([start, end])
    start = end
  }
  return pages
}

export async function buildBriefPdf(node: HTMLElement, title: string): Promise<Blob> {
  // Font files are embedded once and reused, so later PDFs build faster.
  fontCss ??= getFontEmbedCSS(node).catch(() => '')
  const canvas = await toCanvas(node, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    fontEmbedCSS: await fontCss,
    cacheBust: false,
    // The source sits off screen; draw the copy at the origin.
    style: { position: 'static', left: '0', top: '0', margin: '0', transform: 'none' },
  })

  const cssWidth = node.offsetWidth
  const scale = canvas.width / cssWidth
  const mmPerPx = CONTENT_W / cssWidth
  const pages = pageBreaks(node, CONTENT_H / mmPerPx)

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  pdf.setProperties({ title, subject: 'Durga Visarjan 2026 ghat water-quality brief', creator: 'Visarjan Ghat Watch' })

  pages.forEach(([from, to], i) => {
    if (i > 0) pdf.addPage()
    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = Math.max(1, Math.round((to - from) * scale))
    const ctx = slice.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, Math.round(from * scale), canvas.width, slice.height, 0, 0, slice.width, slice.height)
    pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN_X, MARGIN_TOP, CONTENT_W, (to - from) * mmPerPx)

    pdf.setDrawColor(203, 213, 225)
    pdf.line(MARGIN_X, PAGE_H - 11, PAGE_W - MARGIN_X, PAGE_H - 11)
    pdf.setFontSize(8)
    pdf.setTextColor(100, 116, 139)
    pdf.text('Visarjan Ghat Watch · Durga Visarjan 2026', MARGIN_X, PAGE_H - 7)
    pdf.text(`Page ${i + 1} / ${pages.length}`, PAGE_W - MARGIN_X, PAGE_H - 7, { align: 'right' })
  })

  return pdf.output('blob')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Hands a PDF to the phone or Windows share menu (WhatsApp appears there when installed).
 * Where a browser cannot share files, the PDF is downloaded and WhatsApp opens so it can be attached.
 * Throws AbortError if the officer closes the share menu.
 */
export async function sharePdf(blob: Blob, fileName: string, message: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: fileName.replace(/\.pdf$/, ''), text: message })
    return 'shared'
  }
  downloadBlob(blob, fileName)
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener')
  return 'downloaded'
}
