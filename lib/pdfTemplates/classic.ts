import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { RGB, fmtDate, num } from './shared'

const INK: RGB = [31, 20, 53]
const MUTED: RGB = [110, 105, 125]
const BAND: RGB = [247, 248, 250]
const BADGE: RGB = [236, 231, 229]
const ACCENT: RGB = [238, 175, 58]
const AMBER: RGB = [255, 193, 7]
const LINE: RGB = [225, 225, 232]

export async function buildClassicPdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16
  const R = W - M
  const TOP = 16
  const BOTTOM = H - 18
  let y = TOP

  const newPage = () => {
    pdf.addPage()
    y = TOP
  }

  // Décalage vertical pour centrer un texte dans une hauteur donnée
  const mid = (size: number) => size * 0.3528 * 0.35

  // Badge arrondi (pilule) avec texte centré
  const pill = (
    text: string,
    x: number,
    top: number,
    h: number,
    size: number,
    fill: RGB,
    align: 'left' | 'right' = 'left',
    style: 'bold' | 'normal' = 'normal'
  ) => {
    pdf.setFont('helvetica', style)
    pdf.setFontSize(size)
    const padX = 3
    const w = pdf.getTextWidth(text) + padX * 2
    const px = align === 'right' ? x - w : x
    pdf.setFillColor(...fill)
    pdf.roundedRect(px, top, w, h, h / 2, h / 2, 'F')
    pdf.setTextColor(...INK)
    pdf.text(text, px + padX, top + h / 2 + mid(size))
  }

  /* ===== Logo ===== */
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

  /* ===== En-tête ===== */
  drawLogo(M + 6, y + 6)
  pdf.setFont('helvetica', 'bolditalic')
  pdf.setFontSize(20)
  pdf.setTextColor(...INK)
  pdf.text('Mon', M + 15, y + 8.5)
  pdf.setTextColor(...ACCENT)
  pdf.text('ity', M + 15 + pdf.getTextWidth('Mon'), y + 8.5)

  pill(`N° ${invoice.id}`, R, y + 1.5, 6.5, 8.5, BADGE, 'right')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(34)
  pdf.setTextColor(...INK)
  pdf.text('FACTURE', M, y + 26)
  y += 34

  /* ===== Bandeau dates ===== */
  const bandH = 12
  pdf.setFillColor(...BAND)
  pdf.roundedRect(M, y, R - M, bandH, 2, 2, 'F')

  const by = y + bandH / 2 + mid(9.5)
  pdf.setFontSize(9.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...INK)
  pdf.text('Date:', M + 4, by)
  const dl = pdf.getTextWidth('Date: ')
  pdf.setFont('helvetica', 'normal')
  pdf.text(fmtDate(invoice.invoiceDate), M + 4 + dl, by)

  const dueVal = fmtDate(invoice.dueDate)
  pdf.setFont('helvetica', 'normal')
  const dvw = pdf.getTextWidth(dueVal)
  pdf.text(dueVal, R - 4, by, { align: 'right' })
  pdf.setFont('helvetica', 'bold')
  pdf.text('Échéance:', R - 4 - dvw - pdf.getTextWidth(' '), by, { align: 'right' })

  y += bandH + 7

  /* ===== Émetteur / Client ===== */
  const partyBox = (label: string, name: string, address: string) => {
    const innerW = R - M - 10

    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(11)
    const nameLines = pdf.splitTextToSize(name || '-', innerW) as string[]
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    const addrLines = address ? (pdf.splitTextToSize(address, innerW) as string[]) : []

    const nameLH = 5.05
    const addrLH = 4.36
    const firstName = 15
    const lastName = firstName + (nameLines.length - 1) * nameLH
    const lastAddr = addrLines.length ? lastName + 4.8 + (addrLines.length - 1) * addrLH : lastName
    const h = lastAddr + 4.5

    if (y + h > BOTTOM) newPage()

    pdf.setFillColor(...BAND)
    pdf.roundedRect(M, y, R - M, h, 2, 2, 'F')
    pill(label, M + 5, y + 4, 5.5, 8, BADGE)

    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(11)
    pdf.setTextColor(...INK)
    pdf.text(nameLines, M + 5, y + firstName)

    if (addrLines.length) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9.5)
      pdf.setTextColor(...MUTED)
      pdf.text(addrLines, M + 5, y + lastName + 4.8 - (addrLines.length - 1) * 0)
    }
    y += h + 5
  }

  partyBox('Émetteur', invoice.issuerName, invoice.issuerAddress)
  partyBox('Client', invoice.clientName, invoice.clientAddress)
  y += 3

  /* ===== Tableau ===== */
  const X_NUM = M + 2
  const X_DESC = M + 14
  const DESC_W = 70
  const X_QTY = M + 104 // aligné à droite
  const X_PU = M + 136 // aligné à droite
  const X_TOT = R - 2 // aligné à droite

  const drawHead = () => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...MUTED)
    const hy = y + 5
    pdf.text('#', X_NUM, hy)
    pdf.text('Description', X_DESC, hy)
    pdf.text('Qté', X_QTY, hy, { align: 'right' })
    pdf.text('P.U', X_PU, hy, { align: 'right' })
    pdf.text('Total', X_TOT, hy, { align: 'right' })
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.25)
    pdf.line(M, y + 8, R, y + 8)
    y += 8
  }

  drawHead()

  const lines = invoice.lines || []
  if (lines.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...MUTED)
    pdf.text('Aucune ligne de facture', W / 2, y + 8, { align: 'center' })
    y += 14
  }

  lines.forEach((line, index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    const descLines = pdf.splitTextToSize(line.description || '', DESC_W) as string[]
    const rowH = Math.max(10, descLines.length * 4.6 + 5.4)

    if (y + rowH > BOTTOM) {
      newPage()
      drawHead()
    }

    const ty = y + (rowH - descLines.length * 4.6) / 2 + 3.3
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...INK)
    pdf.text(String(index + 1), X_NUM, ty)
    pdf.text(descLines, X_DESC, ty)
    pdf.text(String(line.quantity), X_QTY, ty, { align: 'right' })
    pdf.text(num(line.unitPrice), X_PU, ty, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.text(num(line.quantity * line.unitPrice), X_TOT, ty, { align: 'right' })

    y += rowH
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.25)
    pdf.line(M, y, R, y)
  })

  y += 8

  /* ===== Totaux ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0

  type RowOpts = { big?: boolean; badge?: RGB; muted?: boolean; line?: boolean }
  const totalRow = (label: string, value: string, o: RowOpts = {}) => {
    const h = o.big ? 11 : 9
    if (y + h > BOTTOM) newPage()

    if (o.line) {
      pdf.setDrawColor(...LINE)
      pdf.setLineWidth(0.25)
      pdf.line(M, y, R, y)
    }

    const cy = y + h / 2
    const lsize = o.big ? 12 : 10

    pdf.setFont('helvetica', o.big ? 'bold' : 'normal')
    pdf.setFontSize(lsize)
    pdf.setTextColor(...(o.muted ? MUTED : INK))
    pdf.text(label, M, cy + mid(lsize))

    if (o.badge) {
      pill(value, R, cy - 3.4, 6.8, o.big ? 10 : 9.5, o.badge, 'right', 'bold')
    } else {
      pdf.setFont('helvetica', o.muted ? 'normal' : 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(...(o.muted ? MUTED : INK))
      pdf.text(value, R, cy + mid(10), { align: 'right' })
    }
    y += h
  }

  pdf.setDrawColor(...LINE)
  pdf.setLineWidth(0.25)
  pdf.line(M, y, R, y)

  totalRow('Total HT', `${num(totals.totalHT)} FCFA`)
  if (invoice.vatActive) {
    totalRow(`TVA ${invoice.vatRate} %`, `${num(totals.totalVAT)} FCFA`)
  }
  totalRow('Total TTC', `${num(totals.totalTTC)} FCFA`, { big: true, badge: ACCENT, line: true })

  if (hasAdvance) {
    totalRow(
      invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
      `- ${num(advance)} FCFA`
    )
    totalRow('Reste à payer', `${num(remaining)} FCFA`, { big: true, badge: AMBER, line: true })
    if (invoice.dueDate) {
      totalRow('Reste à payer avant le', fmtDate(invoice.dueDate), { muted: true })
    }
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...MUTED)
    pdf.text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 8, { align: 'center' })
  }

  return pdf
}