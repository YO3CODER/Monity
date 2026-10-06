import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'

type RGB = [number, number, number]

const ACCENT: RGB = [238, 175, 58]
const WARNING: RGB = [255, 193, 7]
const DARK: RGB = [31, 18, 53]
const GRAY: RGB = [110, 110, 120]
const LIGHT: RGB = [246, 246, 248]
const GHOST: RGB = [235, 235, 240]
const LINE: RGB = [220, 220, 225]

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

export function buildInvoicePdf(invoice: Invoice, totals: Totals): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.setLineHeightFactor(1.35)

  const W = pdf.internal.pageSize.getWidth()   // 210
  const H = pdf.internal.pageSize.getHeight()  // 297
  const M = 18          // marge gauche / droite
  const R = W - M       // bord droit
  const TOP = 20        // marge haute
  let y = TOP

  /* ===== Colonnes du tableau ===== */
  const COL_NUM = M + 4
  const COL_DESC = M + 16
  const DESC_W = 64
  const COL_QTY = M + 92     // aligné à droite
  const COL_PU = M + 130     // aligné à droite
  const COL_TOTAL = R - 4    // aligné à droite

  /* ===== Logo : rond sombre + icône "layers" ===== */
  const drawLogo = (cx: number, cy: number) => {
    pdf.setFillColor(...DARK)
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
  pdf.setFontSize(24)
  const nameX = M + 15
  pdf.setTextColor(...DARK)
  pdf.text('Mon', nameX, y + 9)
  pdf.setTextColor(...ACCENT)
  pdf.text('ity', nameX + pdf.getTextWidth('Mon'), y + 9)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(46)
  pdf.setTextColor(...DARK)
  pdf.text('FACTURE', M, y + 32)

  // Pastille du numéro de facture
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  const idText = `Facture n° ${invoice.id}`
  const pillW = pdf.getTextWidth(idText) + 10
  pdf.setFillColor(...GHOST)
  pdf.roundedRect(R - pillW, y, pillW, 8, 4, 4, 'F')
  pdf.setTextColor(...DARK)
  pdf.text(idText, R - pillW / 2, y + 5.4, { align: 'center' })

  // Dates
  const dateLine = (label: string, value: string, yy: number) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...DARK)
    pdf.text(value, R, yy, { align: 'right' })
    const vw = pdf.getTextWidth(value)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, R - vw - 2, yy, { align: 'right' })
  }
  dateLine('DATE', fmtDate(invoice.invoiceDate), y + 18)
  dateLine("DATE D'ÉCHÉANCE", fmtDate(invoice.dueDate), y + 26)

  y += 48

  /* ===== Émetteur / Client ===== */
  const COL_W = 85
  const drawParty = (
    label: string,
    name: string,
    address: string,
    x: number,
    align: 'left' | 'right'
  ): number => {
    let yy = y

    // Pastille du libellé
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const lw = pdf.getTextWidth(label) + 8
    const lx = align === 'left' ? x : x - lw
    pdf.setFillColor(...GHOST)
    pdf.roundedRect(lx, yy, lw, 6.5, 3.2, 3.2, 'F')
    pdf.setTextColor(...DARK)
    pdf.text(label, lx + lw / 2, yy + 4.5, { align: 'center' })
    yy += 14

    // Nom
    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(13)
    pdf.setTextColor(...DARK)
    const nameLines = pdf.splitTextToSize(name || '-', COL_W) as string[]
    pdf.text(nameLines, x, yy, { align })
    yy += nameLines.length * 6 + 1

    // Adresse
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...GRAY)
    const addrLines = pdf.splitTextToSize(address || '', COL_W) as string[]
    if (addrLines.length > 0 && addrLines[0] !== '') {
      pdf.text(addrLines, x, yy, { align })
      yy += addrLines.length * 5
    }
    return yy
  }

  const leftBottom = drawParty('Émetteur', invoice.issuerName, invoice.issuerAddress, M, 'left')
  const rightBottom = drawParty('Client', invoice.clientName, invoice.clientAddress, R, 'right')
  y = Math.max(leftBottom, rightBottom) + 14

  /* ===== Tableau des lignes ===== */
  const HEADER_H = 12

  const drawTableHeader = () => {
    pdf.setFillColor(...LIGHT)
    pdf.rect(M, y, R - M, HEADER_H, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...DARK)
    const ty = y + 7.6
    pdf.text('#', COL_NUM, ty)
    pdf.text('Description', COL_DESC, ty)
    pdf.text('Qté', COL_QTY, ty, { align: 'right' })
    pdf.text('Prix unitaire', COL_PU, ty, { align: 'right' })
    pdf.text('Total', COL_TOTAL, ty, { align: 'right' })
    y += HEADER_H
  }

  drawTableHeader()

  const lines = invoice.lines || []

  if (lines.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...GRAY)
    pdf.text('Aucune ligne de facture', W / 2, y + 8, { align: 'center' })
    y += 14
  }

  lines.forEach((line, index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)
    const descLines = pdf.splitTextToSize(line.description || '', DESC_W) as string[]
    const rowH = Math.max(13, descLines.length * 5 + 8)

    // Saut de page propre : une ligne n'est jamais coupée en deux
    if (y + rowH > H - M - 14) {
      pdf.addPage()
      y = TOP
      drawTableHeader()
    }

    if (index % 2 === 1) {
      pdf.setFillColor(...LIGHT)
      pdf.rect(M, y, R - M, rowH, 'F')
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.5)
    pdf.setTextColor(...DARK)
    const textBlockH = descLines.length * 5
    const ty = y + (rowH - textBlockH) / 2 + 3.6
    pdf.text(String(index + 1), COL_NUM, ty)
    pdf.text(descLines, COL_DESC, ty)
    pdf.text(String(line.quantity), COL_QTY, ty, { align: 'right' })
    pdf.text(money(line.unitPrice), COL_PU, ty, { align: 'right' })
    pdf.text(money(line.quantity * line.unitPrice), COL_TOTAL, ty, { align: 'right' })

    y += rowH
  })

  /* ===== Totaux ===== */
  const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
  const hasAdvance = advance > 0

  // Assez de place pour tout le bloc des totaux, sinon nouvelle page
  const needed = 34 + (invoice.vatActive ? 9 : 0) + (hasAdvance ? 40 : 0)
  if (y + needed > H - M - 8) {
    pdf.addPage()
    y = TOP
  }

  const LABEL_X = M + 88
  y += 14

  const row = (label: string, value: string) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(...DARK)
    pdf.text(label, LABEL_X, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, R, y, { align: 'right' })
    y += 9
  }

  const badgeRow = (label: string, value: string, color: RGB) => {
    y += 2
    pdf.setDrawColor(...LINE)
    pdf.setLineWidth(0.2)
    pdf.line(LABEL_X, y - 3, R, y - 3)
    y += 5

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    const w = pdf.getTextWidth(value) + 10
    pdf.setFillColor(...color)
    pdf.roundedRect(R - w, y - 5.2, w, 10, 5, 5, 'F')
    pdf.setTextColor(...DARK)
    pdf.text(label, LABEL_X, y + 1.4)
    pdf.text(value, R - 5, y + 1.4, { align: 'right' })
    y += 12
  }

  row('Total Hors Taxes', money(totals.totalHT))
  if (invoice.vatActive) {
    row(`TVA ${invoice.vatRate} %`, money(totals.totalVAT))
  }
  badgeRow('Total TTC', money(totals.totalTTC), ACCENT)

  if (hasAdvance) {
    row(
      invoice.advanceDate ? `Avance versée le ${fmtDate(invoice.advanceDate)}` : 'Avance versée',
      `- ${money(advance)}`
    )
    badgeRow('Reste à payer', money(remaining), WARNING)

    if (invoice.dueDate) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(...GRAY)
      pdf.text('Reste à payer avant le', LABEL_X, y)
      pdf.text(fmtDate(invoice.dueDate), R, y, { align: 'right' })
      y += 7
    }
  }

  /* ===== Numéros de page ===== */
  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...GRAY)
    pdf.text(`Facture ${invoice.id}  -  Page ${i} / ${pages}`, W / 2, H - 9, { align: 'center' })
  }

  return pdf
}