import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { RGB, money, fmtDate } from './shared'

const PAPER: RGB = [255, 251, 246]
const BOX: RGB = [243, 237, 229]
const INK: RGB = [15, 15, 15]
const MUTED: RGB = [90, 90, 90]
const LIME: RGB = [238, 255, 60]

export async function buildStudioPdf(invoice: Invoice, totals: Totals): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.3)

  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16
  const R = W - M
  const TOP = 18
  const BOTTOM = H - 18
  let y = TOP

  const paintPage = () => {
    pdf.setFillColor(...PAPER)
    pdf.rect(0, 0, W, H, 'F')
  }
  const newPage = () => {
    pdf.addPage()
    paintPage()
    y = TOP
  }
  paintPage()

  // Décalage pour centrer verticalement un texte
  const mid = (size: number) => size * 0.3528 * 0.36

  // Bloc arrondi avec contour noir
  const box = (x: number, top: number, w: number, h: number, fill: RGB) => {
    pdf.setFillColor(...fill)
    pdf.setDrawColor(...INK)
    pdf.setLineWidth(0.35)
    pdf.roundedRect(x, top, w, h, 4, 4, 'FD')
  }

  const text = (
    str: string | string[],
    x: number,
    yy: number,
    size: number,
    style: 'bold' | 'normal',
    color: RGB,
    align: 'left' | 'right' = 'left'
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

  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0
  const dueLabel = hasAdvance ? 'Reste à payer' : 'Total à payer'
  const dueValue = money(hasAdvance ? remaining : totals.totalTTC)

  /* ===== En-tête : titre à gauche, émetteur à droite ===== */
  const issuerName = split(invoice.issuerName || '-', 13, 'bold', 80)
  const issuerAddr = invoice.issuerAddress ? split(invoice.issuerAddress, 8.5, 'normal', 80) : []
  const headH = Math.max(30, 9 + issuerName.length * 5.6 + issuerAddr.length * 4 + 7)

  box(M, y, R - M, headH, BOX)
  text('FACTURE', M + 8, y + 16, 26, 'bold', INK)
  text(`Échéance : ${fmtDate(invoice.dueDate)}`, M + 8, y + 23, 8, 'normal', MUTED)

  text(issuerName, R - 8, y + 10, 13, 'bold', INK, 'right')
  if (issuerAddr.length) {
    text(issuerAddr, R - 8, y + 10 + issuerName.length * 5.6 + 1, 8.5, 'normal', MUTED, 'right')
  }
  y += headH + 9

  /* ===== Ligne : client, numéro, montant à payer ===== */
  const clientName = split(invoice.clientName || '-', 13, 'bold', 62)
  const clientAddr = invoice.clientAddress ? split(invoice.clientAddress, 8.5, 'normal', 62) : []
  const clientH = 6 + clientName.length * 5.6 + clientAddr.length * 4
  const rowH = Math.max(24, clientH)

  text('Facturé à', M + 2, y + 3, 8, 'bold', INK)
  text(clientName, M + 2, y + 9.5, 13, 'bold', INK)
  if (clientAddr.length) {
    text(clientAddr, M + 2, y + 9.5 + clientName.length * 5.6 - 0.5, 8.5, 'normal', MUTED)
  }

  const midX = M + 72
  text('N° de facture', midX, y + 3, 8, 'bold', INK)
  text(String(invoice.id), midX, y + 10.5, 15, 'bold', INK)
  text(fmtDate(invoice.invoiceDate), midX, y + 16, 8.5, 'normal', MUTED)

  const dueW = 58
  box(R - dueW, y, dueW, 22, LIME)
  text(dueLabel, R - 6, y + 7, 7.5, 'normal', INK, 'right')
  let fs = 14
  pdf.setFont('helvetica', 'bold')
  while (fs > 8) {
    pdf.setFontSize(fs)
    if (pdf.getTextWidth(dueValue) <= dueW - 12) break
    fs -= 1
  }
  text(dueValue, R - 6, y + 16, fs, 'bold', INK, 'right')

  y += rowH + 8

  /* ===== Tableau ===== */
  const X_ITEM = M + 8
  const DESC_W = 64
  const X_QTY = M + 96
  const X_PU = M + 128
  const X_TOT = R - 8
  const HEAD_H = 9

  const drawHead = () => {
    box(M, y, R - M, HEAD_H, LIME)
    const hy = y + HEAD_H / 2 + mid(8)
    text('Article', X_ITEM, hy, 8, 'bold', INK)
    text('Qté', X_QTY, hy, 8, 'bold', INK, 'right')
    text('Prix', X_PU, hy, 8, 'bold', INK, 'right')
    text('Total', X_TOT, hy, 8, 'bold', INK, 'right')
    y += HEAD_H + 4
  }

  const rows = (invoice.lines || []).map((line) => {
    const descLines = split(line.description || '', 8.5, 'normal', DESC_W)
    return { line, descLines, h: Math.max(10, descLines.length * 4 + 5) }
  })

  drawHead()

  if (rows.length === 0) {
    box(M, y, R - M, 16, BOX)
    text('Aucune ligne de facture', W / 2, y + 8 + mid(9), 9, 'normal', MUTED, 'center' as 'left')
    y += 16
  } else {
    let i = 0
    while (i < rows.length) {
      const avail = BOTTOM - y
      let chunkH = 8
      const start = i
      while (i < rows.length && chunkH + rows[i].h <= avail) {
        chunkH += rows[i].h
        i++
      }
      if (i === start) {
        chunkH += rows[i].h
        i++
      }

      box(M, y, R - M, chunkH, BOX)
      let ry = y + 4
      for (let k = start; k < i; k++) {
        const r = rows[k]
        const cy = ry + r.h / 2
        const first = cy - ((r.descLines.length - 1) * 4) / 2 + mid(8.5)
        text(r.descLines, X_ITEM, first, 8.5, 'normal', INK)
        const one = cy + mid(8.5)
        text(String(r.line.quantity), X_QTY, one, 8.5, 'normal', INK, 'right')
        text(money(r.line.unitPrice), X_PU, one, 8.5, 'normal', INK, 'right')
        text(money(r.line.quantity * r.line.unitPrice), X_TOT, one, 8.5, 'normal', INK, 'right')
        ry += r.h
      }
      y += chunkH

      if (i < rows.length) {
        newPage()
        drawHead()
      }
    }
  }
  y += 8

  /* ===== Bas : paiement à gauche, totaux à droite ===== */
  type Sum = { label: string; value: string }
  const sums: Sum[] = [{ label: 'Sous-total (HT)', value: money(totals.totalHT) }]
  if (invoice.vatActive) {
    sums.push({ label: `TVA (${invoice.vatRate} %)`, value: money(totals.totalVAT) })
  }
  sums.push({ label: 'Total TTC', value: money(totals.totalTTC) })
  if (hasAdvance) {
    sums.push({
      label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
      value: `- ${money(advance)}`,
    })
  }

  const info: [string, string][] = [["Date d'échéance", fmtDate(invoice.dueDate)]]
  if (hasAdvance) {
    info.push(['Avance reçue', money(advance)])
    if (invoice.advanceDate) info.push(["Date de l'avance", fmtDate(invoice.advanceDate)])
  }

  const SUM_W = 74
  const PAY_W = R - M - SUM_W - 6
  const sumH = 10 + (sums.length - 1) * 7.5 + 6
  const infoH = 16 + (info.length - 1) * 6 + 6
  const boxH = Math.max(sumH, infoH)
  const TOTAL_H = 11
  const sectionH = boxH + 5 + TOTAL_H

  if (y + sectionH > BOTTOM) newPage()

  box(M, y, PAY_W, boxH, BOX)
  text('Informations de paiement', M + 6, y + 8, 8.5, 'bold', INK)
  info.forEach(([label, value], i) => {
    const ry = y + 16 + i * 6
    text(label, M + 6, ry, 8, 'normal', MUTED)
    text(value, M + PAY_W - 6, ry, 8, 'bold', INK, 'right')
  })

  const sx = R - SUM_W
  box(sx, y, SUM_W, boxH, BOX)
  sums.forEach((s, i) => {
    const ry = y + 10 + i * 7.5
    text(s.label, sx + 6, ry, 8, 'bold', INK)
    text(s.value, R - 6, ry, 8, 'normal', INK, 'right')
  })

  const ty = y + boxH + 5
  box(sx, ty, SUM_W, TOTAL_H, LIME)
  const tmid = ty + TOTAL_H / 2 + mid(8.5)
  text(hasAdvance ? 'Reste à payer' : 'Total', sx + 6, tmid, 8.5, 'bold', INK)
  text(dueValue, R - 6, tmid, 8.5, 'bold', INK, 'right')

  y += sectionH + 12

  /* ===== Remerciement et conditions ===== */
  if (y + 18 > BOTTOM) newPage()

  text('Merci de votre confiance', M, y + 4, 11, 'bold', INK)
  if (invoice.issuerName) {
    text(invoice.issuerName, M, y + 10, 8.5, 'normal', MUTED)
  }
  text('Conditions', R, y + 3, 8, 'bold', INK, 'right')
  if (invoice.dueDate) {
    const cond = split(`Paiement à effectuer avant le ${fmtDate(invoice.dueDate)}.`, 7.5, 'normal', 70)
    text(cond, R, y + 8, 7.5, 'normal', MUTED, 'right')
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 9, 8, 'normal', MUTED, 'center' as 'left')
  }

  return pdf
}