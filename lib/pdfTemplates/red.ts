import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { RGB, money, fmtDate } from './shared'

const INK: RGB = [15, 15, 15]
const MUTED: RGB = [80, 80, 80]
const RED: RGB = [220, 53, 69]
const WHITE: RGB = [255, 255, 255]
const WATERMARK: RGB = [232, 232, 232]

export async function buildRedPdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16
  const R = W - M
  const TOP = 14
  const BOTTOM = H - 16
  let y = TOP

  const newPage = () => {
    pdf.addPage()
    y = TOP
  }

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

  // Icône "layers" (logo)
  const layers = (cx: number, cy: number, size: number, color: RGB, lw: number) => {
    const k = size / 24
    const ox = cx - size / 2
    const oy = cy - size / 2
    const P = (px: number, py: number): [number, number] => [ox + px * k, oy + py * k]
    pdf.setDrawColor(...color)
    pdf.setLineWidth(lw)
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

  /* ===== Titre souligné + carré rouge ===== */
  text('FACTURE', M, y + 20, 52, 'bold', INK)
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(1.1)
  pdf.line(M, y + 25, M + 100, y + 25)

  const SQ = 26
  pdf.setFillColor(...RED)
  pdf.rect(R - SQ, y, SQ, SQ, 'F')
  layers(R - SQ / 2, y + 9, 9, WHITE, 0.8)
  text('Monity', R - SQ / 2, y + 20, 9, 'bold', WHITE, 'center')

  y += 38

  /* ===== Client à gauche, numéro et date à droite ===== */
  const clientName = split(invoice.clientName || '-', 14, 'bold', 100)
  const clientAddr = invoice.clientAddress ? split(invoice.clientAddress, 8.5, 'normal', 100) : []

  text('Facturé à :', M, y + 3, 8.5, 'normal', INK)
  text(clientName, M, y + 11, 14, 'bold', RED)
  if (clientAddr.length) {
    text(clientAddr, M, y + 11 + clientName.length * 6 + 1, 8.5, 'normal', MUTED)
  }

  const RX = R - 52
  text('N° de facture :', RX, y + 3, 8, 'normal', INK)
  text(String(invoice.id), RX, y + 8.5, 8.5, 'normal', INK)
  pdf.setDrawColor(...INK)
  pdf.setLineWidth(0.3)
  pdf.line(RX, y + 10.5, R, y + 10.5)

  text('Date :', RX, y + 17, 8, 'normal', INK)
  text(fmtDate(invoice.invoiceDate), RX, y + 22.5, 8.5, 'normal', INK)
  pdf.line(RX, y + 24.5, R, y + 24.5)

  const infoH = Math.max(28, 12 + clientName.length * 6 + clientAddr.length * 4.2)
  y += infoH + 8

  /* ===== Filigrane circulaire (derrière le tableau) ===== */
  pdf.setFillColor(...WATERMARK)
  pdf.circle(M + 88, y + 44, 38, 'F')
  layers(M + 88, y + 44, 40, WHITE, 2.6)

  /* ===== Tableau quadrillé ===== */
  const COL = {
    no: { x: M, w: 14 },
    item: { x: M + 14, w: 72 },
    qty: { x: M + 86, w: 20 },
    price: { x: M + 106, w: 34 },
    total: { x: M + 140, w: R - (M + 140) },
  }
  const HEAD_H = 8
  let gridTop = y

  const verticals = (from: number, to: number) => {
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.3)
    ;[COL.item.x, COL.qty.x, COL.price.x, COL.total.x].forEach((x) => pdf.line(x, from, x, to))
    pdf.rect(M, from, R - M, to - from, 'S')
  }

  const drawHead = () => {
    gridTop = y
    pdf.setFillColor(...RED)
    pdf.rect(M, y, R - M, HEAD_H, 'F')
    const hy = y + HEAD_H / 2 + mid(8)
    text('No', COL.no.x + COL.no.w / 2, hy, 8, 'bold', WHITE, 'center')
    text('Articles', COL.item.x + 4, hy, 8, 'bold', WHITE)
    text('Qté', COL.qty.x + COL.qty.w / 2, hy, 8, 'bold', WHITE, 'center')
    text('Prix', COL.price.x + COL.price.w / 2, hy, 8, 'bold', WHITE, 'center')
    text('Total', COL.total.x + COL.total.w / 2, hy, 8, 'bold', WHITE, 'center')
    y += HEAD_H
  }

  drawHead()

  const lines = invoice.lines || []
  if (lines.length === 0) {
    text('Aucune ligne de facture', W / 2, y + 7, 9, 'normal', MUTED, 'center')
    y += 12
  }

  lines.forEach((line, index) => {
    const descLines = split(line.description || '', 8.5, 'normal', COL.item.w - 8)
    const rowH = Math.max(9, descLines.length * 4 + 5)

    if (y + rowH > BOTTOM - 10) {
      verticals(gridTop, y)
      newPage()
      drawHead()
    }

    const cy = y + rowH / 2
    const first = cy - ((descLines.length - 1) * 4) / 2 + mid(8.5)
    const one = cy + mid(8.5)
    text(String(index + 1), COL.no.x + COL.no.w / 2, one, 8.5, 'normal', INK, 'center')
    text(descLines, COL.item.x + 4, first, 8.5, 'normal', INK)
    text(String(line.quantity), COL.qty.x + COL.qty.w / 2, one, 8.5, 'normal', INK, 'center')
    text(money(line.unitPrice), COL.price.x + COL.price.w / 2, one, 8.5, 'normal', INK, 'center')
    text(money(line.quantity * line.unitPrice), R - 4, one, 8.5, 'normal', INK, 'right')

    y += rowH
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.3)
    pdf.line(M, y, R, y)
  })

  verticals(gridTop, y)

  /* ===== Totaux ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0

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

  const TX = M + 86
  const TW = R - TX
  const ROW = 8
  const FINAL_H = 9
  if (y + rows.length * ROW + FINAL_H > BOTTOM) newPage()

  rows.forEach((r) => {
    const cy = y + ROW / 2 + mid(8.5)
    text(r.label, TX + 4, cy, 8.5, 'normal', INK)
    text(r.value, R - 4, cy, 8.5, 'normal', INK, 'right')
    y += ROW
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.3)
    pdf.line(TX, y, R, y)
  })

  pdf.setFillColor(...RED)
  pdf.rect(TX, y, TW, FINAL_H, 'F')
  const fy = y + FINAL_H / 2 + mid(8.5)
  text(hasAdvance ? 'Reste à payer :' : 'Total TTC :', TX + 4, fy, 8.5, 'bold', WHITE)
  text(money(hasAdvance ? remaining : totals.totalTTC), R - 4, fy, 8.5, 'bold', WHITE, 'right')
  y += FINAL_H

  /* ===== Pied : paiement à gauche, émetteur à droite ===== */
  const FOOT_H = 26
  let footTop = Math.max(y + 14, BOTTOM - FOOT_H)
  if (footTop + FOOT_H > BOTTOM + 4) {
    newPage()
    footTop = BOTTOM - FOOT_H
  }

  text('Informations de paiement :', M, footTop + 3, 8, 'bold', RED)
  const pay: [string, string][] = [["Échéance", fmtDate(invoice.dueDate)]]
  if (hasAdvance) {
    pay.push(['Avance', money(advance)])
    if (invoice.advanceDate) pay.push(["Date avance", fmtDate(invoice.advanceDate)])
  }
  pay.forEach(([label, value], i) => {
    const ry = footTop + 10 + i * 5.5
    text(label, M, ry, 8, 'bold', INK)
    text(`: ${value}`, M + 24, ry, 8, 'normal', INK)
  })

  text(invoice.issuerName || '', R, footTop + 3, 8.5, 'bold', INK, 'right')
  if (invoice.issuerAddress) {
    const addr = split(invoice.issuerAddress, 8, 'normal', 70)
    text(addr, R, footTop + 9, 8, 'normal', MUTED, 'right')
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 7, 8, 'normal', MUTED, 'center')
  }

  return pdf
}