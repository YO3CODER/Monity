import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'

type RGB = [number, number, number]

// Illustration du haut : place le fichier dans public/facture.svg
const ILLUSTRATION_URL = '/facture.svg'

const CREAM: RGB = [255, 255, 242]
const INK: RGB = [20, 20, 20]
const GRAY: RGB = [95, 95, 95]
const YELLOW: RGB = [255, 230, 40]
const LIME: RGB = [228, 255, 80]
const PINK: RGB = [255, 184, 240]
const AMBER: RGB = [255, 193, 7]
const ACCENT: RGB = [238, 175, 58]
const SEP: RGB = [205, 205, 195]

// Montant : espace normale (l'espace fine insécable de fr-FR n'est pas rendue par jsPDF)
function money(n: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
  return formatted.replace(/[\u202F\u00A0]/g, ' ') + ' FCFA'
}

// Date au format "05 oct. 2026" (lecture manuelle pour éviter tout décalage de fuseau)
function fmtDate(value?: string): string {
  if (!value) return '-'
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '-'
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/* =========================
   ILLUSTRATION SVG -> PNG
========================= */
type Illustration = { data: string; ratio: number }
let cachedIllustration: Illustration | null = null

async function rasterizeSvg(url: string, widthPx = 1800): Promise<Illustration | null> {
  try {
    if (typeof window === 'undefined') return null
    const res = await fetch(url)
    if (!res.ok) return null
    const text = await res.text()

    const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
    const el = doc.documentElement
    if (!el || el.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null

    // Dimensions : viewBox en priorité, sinon width/height
    let w = 0
    let h = 0
    const vb = el.getAttribute('viewBox')
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number)
      if (p.length === 4 && p[2] > 0 && p[3] > 0) {
        w = p[2]
        h = p[3]
      }
    }
    if (!w || !h) {
      w = parseFloat(el.getAttribute('width') || '') || 1000
      h = parseFloat(el.getAttribute('height') || '') || 1000
    }
    el.setAttribute('width', String(w))
    el.setAttribute('height', String(h))
    if (!el.getAttribute('xmlns')) el.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const svgText = new XMLSerializer().serializeToString(el)
    const blobUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }))

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error('SVG illisible'))
        i.src = blobUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = widthPx
      canvas.height = Math.round(widthPx * (h / w))
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      return { data: canvas.toDataURL('image/png'), ratio: h / w }
    } finally {
      URL.revokeObjectURL(blobUrl)
    }
  } catch (error) {
    console.warn("Illustration du PDF non chargée :", error)
    return null
  }
}

async function loadIllustration(): Promise<Illustration | null> {
  if (cachedIllustration) return cachedIllustration
  const result = await rasterizeSvg(ILLUSTRATION_URL)
  if (result) cachedIllustration = result
  return result
}

/* =========================
   GÉNÉRATION DU PDF
========================= */
export async function buildInvoicePdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const illustration = await loadIllustration()

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()   // 210
  const H = pdf.internal.pageSize.getHeight()  // 297
  const M = 16
  const R = W - M
  const TOP = 16
  const BOTTOM = H - 16
  let y = TOP

  const paintPage = () => {
    pdf.setFillColor(...CREAM)
    pdf.rect(0, 0, W, H, 'F')
  }
  const newPage = () => {
    pdf.addPage()
    paintPage()
    y = TOP
  }
  paintPage()

  // Polygone plein (coup de pinceau)
  const polygon = (pts: [number, number][], color: RGB) => {
    pdf.setFillColor(...color)
    const [x0, y0] = pts[0]
    const vecs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]])
    pdf.lines(vecs, x0, y0, [1, 1], 'F', true)
  }

  /* ===== Logo : rond sombre + icône "layers" ===== */
  const drawLogo = (cx: number, cy: number) => {
    pdf.setFillColor(...INK)
    pdf.circle(cx, cy, 6, 'F')

    const size = 7.2
    const k = size / 24
    const ox = cx - size / 2
    const oy = cy - size / 2
    const P = (px: number, py: number): [number, number] => [ox + px * k, oy + py * k]

    pdf.setDrawColor(...ACCENT)
    pdf.setLineWidth(0.55)
    pdf.setLineCap('round')
    pdf.setLineJoin('round')

    const seg = (pts: [number, number][], close = false) => {
      for (let i = 0; i < pts.length - 1; i++) {
        pdf.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
      }
      if (close) pdf.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1])
    }

    seg([P(12, 2), P(2, 7), P(12, 12), P(22, 7)], true)
    seg([P(2, 17), P(12, 22), P(22, 17)])
    seg([P(2, 12), P(12, 17), P(22, 12)])

    pdf.setLineCap('butt')
    pdf.setLineJoin('miter')
  }

  /* ===== En-tête : logo, titre avec coup de pinceau, illustration ===== */
  drawLogo(M + 6, y + 6)
  pdf.setFont('helvetica', 'bolditalic')
  pdf.setFontSize(18)
  pdf.setTextColor(...INK)
  pdf.text('Mon', M + 15, y + 8.5)
  pdf.setTextColor(...ACCENT)
  pdf.text('ity', M + 15 + pdf.getTextWidth('Mon'), y + 8.5)

  if (illustration) {
    const boxW = 78
    const boxH = 56
    let iw = boxW
    let ih = boxW * illustration.ratio
    if (ih > boxH) {
      ih = boxH
      iw = boxH / illustration.ratio
    }
    pdf.addImage(illustration.data, 'PNG', R - iw, TOP - 4, iw, ih, undefined, 'FAST')
  }

  const T = y + 46 // ligne de base du titre
  polygon(
    [
      [M - 3, T - 11], [M + 28, T - 14], [M + 58, T - 12], [M + 88, T - 15],
      [M + 92, T - 8], [M + 88, T - 3], [M + 91, T + 3], [M + 55, T + 1],
      [M + 24, T + 4], [M - 4, T + 2], [M - 6, T - 5],
    ],
    LIME
  )
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(62)
  pdf.setTextColor(...INK)
  pdf.text('Facture', M, T)

  /* ===== Ligne d'infos : numéro, date, échéance ===== */
  const infoY = T + 14
  const infoPair = (label: string, value: string, x: number, alignRight = false) => {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    const lw = pdf.getTextWidth(label + ' ')
    pdf.setFont('helvetica', 'bold')
    const vw = pdf.getTextWidth(value)
    const start = alignRight ? x - lw - vw : x

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...GRAY)
    pdf.text(label, start, infoY)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...INK)
    pdf.text(value, start + lw, infoY)
  }
  infoPair('N° de facture :', invoice.id, M)
  infoPair('Date :', fmtDate(invoice.invoiceDate), M + 78)
  infoPair('Échéance :', fmtDate(invoice.dueDate), R, true)

  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.35)
  pdf.line(M, infoY + 4, R, infoY + 4)

  /* ===== Bandeau jaune : émetteur / client ===== */
  const PARTY_W = 84
  const prepParty = (name: string, address: string) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    const nameLines = pdf.splitTextToSize(name || '-', PARTY_W) as string[]
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const addrLines = address ? (pdf.splitTextToSize(address, PARTY_W) as string[]) : []
    const height = 7 + nameLines.length * 5.8 + (addrLines.length ? 2 + addrLines.length * 4.4 : 0)
    return { nameLines, addrLines, height }
  }

  const issuer = prepParty(invoice.issuerName, invoice.issuerAddress)
  const client = prepParty(invoice.clientName, invoice.clientAddress)
  const bandY = infoY + 10
  const bandH = Math.max(34, Math.max(issuer.height, client.height) + 17)

  pdf.setFillColor(...YELLOW)
  pdf.rect(0, bandY, W, bandH, 'F')
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.35)
  pdf.line(M, bandY + bandH + 4, R, bandY + bandH + 4)

  const drawParty = (
    label: string,
    p: { nameLines: string[]; addrLines: string[] },
    x: number,
    align: 'left' | 'right'
  ) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...INK)
    pdf.text(label, x, bandY + 9, { align })

    pdf.setFontSize(13)
    pdf.text(p.nameLines, x, bandY + 16, { align })

    if (p.addrLines.length) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text(p.addrLines, x, bandY + 16 + p.nameLines.length * 5.8 + 2, { align })
    }
  }
  drawParty('ÉMETTEUR', issuer, M, 'left')
  drawParty('CLIENT', client, R, 'right')

  y = bandY + bandH + 16

  /* ===== Tableau : en-têtes roses + cadre arrondi ===== */
  const PILL_H = 7.5
  const COLS = {
    desc: { x: M, w: 64 },
    price: { x: M + 72, w: 34 },
    qty: { x: M + 112, w: 30 },
    total: { x: R - 34, w: 34 },
  }
  const DESC_X = M + 5
  const DESC_W = 66
  const PRICE_CX = COLS.price.x + COLS.price.w / 2
  const QTY_CX = COLS.qty.x + COLS.qty.w / 2
  const TOTAL_RIGHT = R - 5

  const pill = (label: string, x: number, w: number) => {
    pdf.setFillColor(...PINK)
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(x, y, w, PILL_H, 2, 2, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.setTextColor(...INK)
    pdf.text(label, x + w / 2, y + 5, { align: 'center' })
  }
  const drawPills = () => {
    pill('DESCRIPTION', COLS.desc.x, COLS.desc.w)
    pill('PRIX', COLS.price.x, COLS.price.w)
    pill('QUANTITÉ', COLS.qty.x, COLS.qty.w)
    pill('TOTAL', COLS.total.x, COLS.total.w)
    y += PILL_H + 4
  }

  drawPills()
  let boxTop = y

  const closeBox = () => {
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.35)
    pdf.roundedRect(M, boxTop, R - M, y - boxTop, 2.5, 2.5, 'S')
  }

  const lines = invoice.lines || []

  if (lines.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...GRAY)
    pdf.text('Aucune ligne de facture', W / 2, y + 8, { align: 'center' })
    y += 14
  }

  lines.forEach((line) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    const descLines = pdf.splitTextToSize(line.description || '', DESC_W) as string[]
    const rowH = Math.max(11, descLines.length * 4.6 + 6)

    // Saut de page propre : une ligne n'est jamais coupée en deux
    if (y + rowH > BOTTOM - 4) {
      closeBox()
      newPage()
      drawPills()
      boxTop = y
    }

    // Séparateur entre deux lignes
    if (y > boxTop + 0.1) {
      pdf.setDrawColor(...SEP)
      pdf.setLineWidth(0.2)
      pdf.line(M + 4, y, R - 4, y)
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...INK)
    const ty = y + (rowH - descLines.length * 4.6) / 2 + 3.3
    pdf.text(descLines, DESC_X, ty)
    pdf.text(money(line.unitPrice), PRICE_CX, ty, { align: 'center' })
    pdf.text(String(line.quantity), QTY_CX, ty, { align: 'center' })
    pdf.setFont('helvetica', 'bold')
    pdf.text(money(line.quantity * line.unitPrice), TOTAL_RIGHT, ty, { align: 'right' })

    y += rowH
  })
  closeBox()
  y += 14

  /* ===== Totaux : gros montant à gauche, encadré vert à droite ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0

  type Row = { label: string; value: string; strong?: boolean }
  const rows: Row[] = [{ label: 'Sous-total (HT)', value: money(totals.totalHT) }]
  if (invoice.vatActive) {
    rows.push({ label: `TVA (${invoice.vatRate} %)`, value: money(totals.totalVAT) })
  }
  rows.push({ label: 'Total TTC', value: money(totals.totalTTC), strong: !hasAdvance })
  if (hasAdvance) {
    rows.push({
      label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
      value: `- ${money(advance)}`,
    })
    rows.push({ label: 'Reste à payer', value: money(remaining), strong: true })
  }

  const ROW_H = 7.4
  const BOX_W = 80
  const boxH = 9 + rows.length * ROW_H
  const sectionH = Math.max(boxH, 36)

  if (y + sectionH > BOTTOM) newPage()

  // Encadré vert
  const boxX = R - BOX_W
  pdf.setFillColor(...LIME)
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.35)
  pdf.roundedRect(boxX, y, BOX_W, boxH, 2.5, 2.5, 'FD')
  rows.forEach((r, i) => {
    const ry = y + 8.5 + i * ROW_H
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(r.strong ? 10 : 8.5)
    pdf.setTextColor(...INK)
    pdf.text(r.label, boxX + 5, ry)
    pdf.setFont('helvetica', r.strong ? 'bold' : 'normal')
    pdf.text(r.value, R - 5, ry, { align: 'right' })
  })

  // Gros montant à payer
  const dueLabel = hasAdvance ? 'Reste à payer' : 'Total à payer'
  const dueValue = money(hasAdvance ? remaining : totals.totalTTC)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...INK)
  pdf.text(dueLabel, M, y + 6)

  let fs = 28
  pdf.setFont('helvetica', 'bold')
  while (fs > 14) {
    pdf.setFontSize(fs)
    if (pdf.getTextWidth(dueValue) <= 66) break
    fs -= 2
  }
  pdf.setFontSize(fs)
  pdf.text(dueValue, M, y + 19)
  const amountW = pdf.getTextWidth(dueValue)

  // Coche ronde
  const cx = M + amountW + 8
  const cy = y + 19 - 3.6
  pdf.setFillColor(...AMBER)
  pdf.circle(cx, cy, 4.2, 'F')
  pdf.setDrawColor(255, 255, 255)
  pdf.setLineWidth(0.8)
  pdf.setLineCap('round')
  pdf.setLineJoin('round')
  pdf.line(cx - 2, cy + 0.2, cx - 0.6, cy + 1.6)
  pdf.line(cx - 0.6, cy + 1.6, cx + 2.2, cy - 1.6)
  pdf.setLineCap('butt')
  pdf.setLineJoin('miter')

  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.35)
  pdf.line(M, y + 24, M + 88, y + 24)

  if (invoice.dueDate) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...GRAY)
    pdf.text(`À payer avant le ${fmtDate(invoice.dueDate)}`, M, y + 31)
  }

  y += sectionH + 14

  /* ===== Informations de paiement + remerciement ===== */
  if (y + 34 > BOTTOM) newPage()

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11)
  pdf.setTextColor(...INK)
  pdf.text('Informations de paiement', M, y + 5)

  const infoRows: [string, string][] = [["Date d'échéance", fmtDate(invoice.dueDate)]]
  if (hasAdvance) {
    infoRows.push(['Avance reçue', money(advance)])
    if (invoice.advanceDate) infoRows.push(["Date de l'avance", fmtDate(invoice.advanceDate)])
  }
  infoRows.forEach(([label, value], i) => {
    const ry = y + 12 + i * 5.6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...GRAY)
    pdf.text(label, M, ry)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...INK)
    pdf.text(value, M + 40, ry)
  })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(...INK)
  const thanks = pdf.splitTextToSize('MERCI DE VOTRE CONFIANCE', 80) as string[]
  pdf.text(thanks, R, y + 6, { align: 'right' })
  if (invoice.issuerName) {
    pdf.setFontSize(9)
    pdf.text(invoice.issuerName, R, y + 6 + thanks.length * 6 + 3, { align: 'right' })
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...GRAY)
    pdf.text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 8, { align: 'center' })
  }

  return pdf
}