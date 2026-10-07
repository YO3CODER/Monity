import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { RGB, money, fmtDate } from './shared'

const BG: RGB = [246, 244, 240]
const RED: RGB = [212, 72, 70]
const PINK: RGB = [240, 208, 205]
const INK: RGB = [25, 25, 25]
const MUTED: RGB = [90, 90, 90]
const WHITE: RGB = [255, 255, 255]

export async function buildBannerPdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16
  const R = W - M
  const TOP = 18
  const BOTTOM = H - 16
  const BANNER_H = 36
  let y = TOP

  const paintPage = () => {
    pdf.setFillColor(...BG)
    pdf.rect(0, 0, W, H, 'F')
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

  /* ===== Bandeau rouge : logo à gauche, titre à droite ===== */
  pdf.setFillColor(...RED)
  pdf.rect(0, 0, W, BANNER_H, 'F')

  {
    const cx = M + 6
    const cy = BANNER_H / 2
    const size = 11
    const k = size / 24
    const ox = cx - size / 2
    const oy = cy - size / 2
    const P = (px: number, py: number): [number, number] => [ox + px * k, oy + py * k]
    pdf.setDrawColor(...WHITE)
    pdf.setLineWidth(0.9)
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

  const issuerShort = split(invoice.issuerName || 'Monity', 12, 'bold', 70)[0]
  text(issuerShort, M + 16, BANNER_H / 2 - 0.5, 12, 'bold', WHITE)
  text('Monity', M + 16, BANNER_H / 2 + 5, 8.5, 'normal', WHITE)

  text('FACTURE', R, BANNER_H / 2 + mid(30), 30, 'normal', WHITE, 'right')

  y = BANNER_H + 14

  /* ===== Client à gauche, infos et montant à droite ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0
  const dueLabel = hasAdvance ? 'Reste à payer :' : 'Total à payer :'
  const dueValue = money(hasAdvance ? remaining : totals.totalTTC)

  const clientName = split(invoice.clientName || '-', 12, 'bold', 95)
  const clientAddr = invoice.clientAddress ? split(invoice.clientAddress, 8.5, 'normal', 95) : []

  text('Facturé à :', M, y + 3, 8, 'normal', INK)
  text(clientName, M, y + 10, 12, 'bold', RED)
  if (clientAddr.length) {
    text(clientAddr, M, y + 10 + clientName.length * 5 + 1.5, 8.5, 'normal', MUTED)
  }

  text(`N° de facture : ${invoice.id}`, R, y + 3, 8, 'normal', INK, 'right')
  text(`Date : ${fmtDate(invoice.invoiceDate)}`, R, y + 8, 8, 'normal', INK, 'right')

  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.8)
  pdf.line(R - 8, y + 12, R, y + 12)

  text(dueLabel, R, y + 17.5, 8, 'normal', MUTED, 'right')
  let fs = 15
  pdf.setFont('helvetica', 'bold')
  while (fs > 9) {
    pdf.setFontSize(fs)
    if (pdf.getTextWidth(dueValue) <= 60) break
    fs -= 1
  }
  text(dueValue, R, y + 25, fs, 'bold', RED, 'right')

  const infoH = Math.max(30, 12 + clientName.length * 5 + clientAddr.length * 4.2)
  y += infoH + 10

  /* ===== Tableau ===== */
  const X_DESC = M + 4
  const DESC_W = 76
  const QTY_CX = M + 100
  const PRICE_CX = M + 130
  const X_TOT = R - 5
  const HEAD_H = 8

  const drawHead = () => {
    pdf.setFillColor(...PINK)
    pdf.rect(M, y, R - M, HEAD_H, 'F')
    const hy = y + HEAD_H / 2 + mid(8)
    text('DESCRIPTION', X_DESC, hy, 8, 'bold', RED)
    text('QTÉ', QTY_CX, hy, 8, 'bold', RED, 'center')
    text('PRIX', PRICE_CX, hy, 8, 'bold', RED, 'center')
    text('TOTAL', X_TOT, hy, 8, 'bold', RED, 'right')
    y += HEAD_H
  }

  drawHead()

  const lines = invoice.lines || []
  if (lines.length === 0) {
    text('Aucune ligne de facture', W / 2, y + 8, 9, 'normal', MUTED, 'center')
    y += 14
  }

  lines.forEach((line) => {
    const descLines = split(line.description || '', 8.5, 'normal', DESC_W)
    const rowH = Math.max(11, descLines.length * 4 + 6)

    if (y + rowH > BOTTOM - 10) {
      newPage()
      drawHead()
    }

    const cy = y + rowH / 2
    const first = cy - ((descLines.length - 1) * 4) / 2 + mid(8.5)
    const one = cy + mid(8.5)
    text(descLines, X_DESC, first, 8.5, 'normal', INK)
    text(String(line.quantity), QTY_CX, one, 8.5, 'normal', INK, 'center')
    text(money(line.unitPrice), PRICE_CX, one, 8.5, 'normal', INK, 'center')
    text(money(line.quantity * line.unitPrice), X_TOT, one, 8.5, 'normal', INK, 'right')

    y += rowH
    pdf.setDrawColor(...MUTED)
    pdf.setLineWidth(0.25)
    pdf.line(M, y, R, y)
  })

  y += 6

  /* ===== Totaux ===== */
  type Row = { label: string; value: string }
  const rows: Row[] = [{ label: 'Sous-total :', value: money(totals.totalHT) }]
  if (invoice.vatActive) {
    rows.push({ label: `TVA (${invoice.vatRate} %) :`, value: money(totals.totalVAT) })
  }
  if (hasAdvance) {
    rows.push({ label: 'Total TTC :', value: money(totals.totalTTC) })
    rows.push({
      label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)}) :` : 'Avance versée :',
      value: `- ${money(advance)}`,
    })
  }

  const TX = M + 96
  const TW = R - TX
  const ROW = 8
  const FINAL_H = 10
  if (y + rows.length * ROW + FINAL_H > BOTTOM) newPage()

  rows.forEach((r) => {
    const cy = y + ROW / 2 + mid(8.5)
    text(r.label, TX + 6, cy, 8.5, 'normal', INK)
    text(r.value, R - 5, cy, 8.5, 'normal', INK, 'right')
    y += ROW
  })

  pdf.setFillColor(...PINK)
  pdf.rect(TX, y + 1, TW, FINAL_H, 'F')
  const fy = y + 1 + FINAL_H / 2 + mid(9)
  text(hasAdvance ? 'RESTE À PAYER :' : 'TOTAL :', TX + 6, fy, 9, 'bold', RED)
  text(dueValue, R - 5, fy, 9, 'bold', RED, 'right')
  y += FINAL_H + 1

  /* ===== Mode de paiement et conditions ===== */
  const pay: [string, string][] = [["Échéance", fmtDate(invoice.dueDate)]]
  if (hasAdvance) {
    pay.push(['Avance reçue', money(advance)])
    if (invoice.advanceDate) pay.push(["Date de l'avance", fmtDate(invoice.advanceDate)])
  }
  const terms = split(
    invoice.dueDate
      ? `Merci d'effectuer le paiement avant le ${fmtDate(invoice.dueDate)}.`
      : 'Merci de votre confiance.',
    8,
    'normal',
    80
  )

  const payH = 9 + pay.length * 5
  const footH = payH + 8 + 6 + terms.length * 4
  if (y + 14 + footH > BOTTOM) newPage()
  else y += 14

  text('Mode de paiement', M, y + 3, 9, 'bold', INK)
  pay.forEach(([label, value], i) => {
    text(`${label} : ${value}`, M, y + 9 + i * 5, 8, 'normal', INK)
  })
  y += payH + 8

  text('Conditions', M, y + 3, 9, 'bold', INK)
  text(terms, M, y + 9, 8, 'normal', INK)

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 7, 8, 'normal', MUTED, 'center')
  }

  return pdf
}