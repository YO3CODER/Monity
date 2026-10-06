import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { RGB, money, fmtDate } from './shared'

const PAPER: RGB = [252, 255, 240]
const INK: RGB = [3, 40, 40]
const MUTED: RGB = [70, 95, 90]
const LIME: RGB = [214, 242, 100]
const RING: RGB = [226, 240, 160]

export async function buildGreenPdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16
  const R = W - M
  const TOP = 16
  const BOTTOM = H - 16
  let y = TOP

  // Cercles décoratifs (bas à droite), dessinés sous le contenu
  const rings = () => {
    pdf.setDrawColor(...RING)
    pdf.setLineWidth(0.3)
    for (let r = 8; r <= 44; r += 4) pdf.circle(W - 6, H - 62, r, 'S')
    for (let r = 8; r <= 50; r += 4) pdf.circle(W - 78, H + 4, r, 'S')
  }
  const paintPage = () => {
    pdf.setFillColor(...PAPER)
    pdf.rect(0, 0, W, H, 'F')
    rings()
  }
  const newPage = () => {
    pdf.addPage()
    paintPage()
    y = TOP
  }
  paintPage()

  type Align = 'left' | 'right' | 'center'
  const text = (
    str: string | string[],
    x: number,
    yy: number,
    size: number,
    style: 'bold' | 'normal',
    color: RGB,
    align: Align = 'left'
  ) => {
    pdf.setFont('helvetica', style)
    pdf.setFontSize(size)
    pdf.setTextColor(...color)
    pdf.text(str, x, yy, { align })
  }

  const split = (str: string, size: number, style: 'bold' | 'normal', width: number): string[] => {
    pdf.setFont('helvetica', style)
    pdf.setFontSize(size)
    return pdf.splitTextToSize(str, width) as string[]
  }

  const mid = (size: number) => size * 0.3528 * 0.36

  /* ===== Haut : émetteur et logo ===== */
  text((invoice.issuerName || '').toUpperCase(), M, y + 4, 8, 'bold', INK)

  const lx = R - 5.5
  const ly = y + 5.5
  pdf.setFillColor(...INK)
  pdf.circle(lx, ly, 5.5, 'F')
  {
    const size = 6.4
    const k = size / 24
    const ox = lx - size / 2
    const oy = ly - size / 2
    const P = (px: number, py: number): [number, number] => [ox + px * k, oy + py * k]
    pdf.setDrawColor(...LIME)
    pdf.setLineWidth(0.5)
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

  /* ===== Gros titre avec pastille lime ===== */
  const T = y + 44
  pdf.setFillColor(...LIME)
  pdf.circle(M + 31, T - 22, 4.5, 'F')
  text('Facture', M - 1, T, 80, 'bold', INK)

  y = T + 14

  /* ===== Date, numéro, client ===== */
  const clientName = split(invoice.clientName || '-', 9, 'bold', 80)
  const clientAddr = invoice.clientAddress ? split(invoice.clientAddress, 8, 'normal', 80) : []

  text(fmtDate(invoice.invoiceDate), M, y + 3, 8, 'normal', MUTED)
  text(`FACTURE N° ${invoice.id}`, M, y + 9, 9, 'bold', INK)

  text('FACTURÉ À :', R, y + 3, 9, 'bold', INK, 'right')
  text(clientName, R, y + 9, 9, 'bold', INK, 'right')
  if (clientAddr.length) {
    text(clientAddr, R, y + 9 + clientName.length * 4.6, 8, 'normal', MUTED, 'right')
  }
  const infoH = Math.max(12, 9 + clientName.length * 4.6 + clientAddr.length * 4)
  y += infoH + 10

  /* ===== Tableau ===== */
  const X_DESC = M + 6
  const DESC_W = 76
  const PRICE_CX = M + 100
  const QTY_CX = M + 134
  const X_TOT = R - 6
  const HEAD_H = 9

  const drawHead = () => {
    pdf.setFillColor(...LIME)
    pdf.roundedRect(M, y, R - M, HEAD_H, HEAD_H / 2, HEAD_H / 2, 'F')
    const hy = y + HEAD_H / 2 + mid(8)
    text('DESCRIPTION', X_DESC, hy, 8, 'bold', INK)
    text('PRIX', PRICE_CX, hy, 8, 'bold', INK, 'center')
    text('QUANTITÉ', QTY_CX, hy, 8, 'bold', INK, 'center')
    text('TOTAL', X_TOT, hy, 8, 'bold', INK, 'right')
    y += HEAD_H + 3
  }

  drawHead()

  const lines = invoice.lines || []
  if (lines.length === 0) {
    text('Aucune ligne de facture', W / 2, y + 8, 9, 'normal', MUTED, 'center')
    y += 14
  }

  lines.forEach((line) => {
    const descLines = split(line.description || '', 8.5, 'normal', DESC_W)
    const rowH = Math.max(9, descLines.length * 4 + 5)

    if (y + rowH > BOTTOM - 8) {
      newPage()
      drawHead()
    }

    const cy = y + rowH / 2
    const first = cy - ((descLines.length - 1) * 4) / 2 + mid(8.5)
    const one = cy + mid(8.5)
    text(descLines, X_DESC, first, 8.5, 'normal', INK)
    text(money(line.unitPrice), PRICE_CX, one, 8.5, 'normal', INK, 'center')
    text(String(line.quantity), QTY_CX, one, 8.5, 'normal', INK, 'center')
    text(money(line.quantity * line.unitPrice), X_TOT, one, 8.5, 'normal', INK, 'right')

    y += rowH
  })

  y += 6

  /* ===== Totaux (alignés à droite) ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0

  type Row = { label: string; value: string; bold?: boolean; pill?: boolean }
  const rows: Row[] = [{ label: 'Sous-total', value: money(totals.totalHT) }]
  if (invoice.vatActive) {
    rows.push({ label: `TVA (${invoice.vatRate} %)`, value: money(totals.totalVAT) })
  }
  rows.push({
    label: hasAdvance ? 'Total TTC' : 'Total',
    value: money(totals.totalTTC),
    bold: true,
    pill: !hasAdvance,
  })
  if (hasAdvance) {
    rows.push({
      label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
      value: `- ${money(advance)}`,
    })
    rows.push({ label: 'Reste à payer', value: money(remaining), bold: true, pill: true })
  }

  const TW = 84
  const tx = R - TW
  const totalsH = rows.reduce((acc, r) => acc + (r.pill ? 11 : 7.5), 0)
  if (y + totalsH > BOTTOM) newPage()

  rows.forEach((r) => {
    const h = r.pill ? 11 : 7.5
    if (r.pill) {
      pdf.setFillColor(...LIME)
      pdf.roundedRect(tx, y + 0.5, TW, 9, 4.5, 4.5, 'F')
    }
    const cy = y + h / 2 + mid(8.5)
    const ox = r.pill ? 6 : 0
    text(r.label, tx + 4 + ox - (r.pill ? 0 : 0), cy, r.pill ? 9.5 : 8.5, r.bold ? 'bold' : 'normal', INK)
    text(r.value, R - 6, cy, r.pill ? 9.5 : 8.5, r.bold ? 'bold' : 'normal', INK, 'right')
    y += h
  })

  /* ===== Pied : remerciement, paiement, émetteur ===== */
  const FOOT_H = 44
  let footTop = Math.max(y + 16, BOTTOM - FOOT_H)
  if (footTop + FOOT_H > BOTTOM + 4) {
    newPage()
    footTop = BOTTOM - FOOT_H
  }

  text('Merci !', M, footTop + 11, 30, 'bold', INK)

  text('INFORMATIONS DE PAIEMENT', M, footTop + 24, 8, 'bold', INK)
  const payRows: string[] = [`Échéance : ${fmtDate(invoice.dueDate)}`]
  if (hasAdvance) {
    payRows.push(`Avance reçue : ${money(advance)}`)
    if (invoice.advanceDate) payRows.push(`Date de l'avance : ${fmtDate(invoice.advanceDate)}`)
  }
  payRows.forEach((row, i) => {
    text(row, M, footTop + 30 + i * 5, 8, 'normal', MUTED)
  })

  text((invoice.issuerName || '').toUpperCase(), R, footTop + 24, 8, 'bold', INK, 'right')
  if (invoice.issuerAddress) {
    const addr = split(invoice.issuerAddress, 7.5, 'normal', 70)
    text(addr, R, footTop + 30, 7.5, 'normal', MUTED, 'right')
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 7, 8, 'normal', MUTED, 'center')
  }

  return pdf
}