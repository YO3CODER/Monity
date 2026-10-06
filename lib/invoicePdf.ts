import jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'

type RGB = [number, number, number]

const ACCENT: RGB = [238, 175, 58]
const WARNING: RGB = [255, 193, 7]
const DARK: RGB = [31, 18, 53]
const GRAY: RGB = [110, 110, 120]
const LIGHT: RGB = [245, 245, 247]
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
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 15          // marge
  const R = W - M       // bord droit
  let y = M

  // Colonnes du tableau
  const COL_NUM = M + 2
  const COL_DESC = M + 12
  const DESC_W = 72
  const COL_QTY = M + 102
  const COL_PU = M + 142
  const COL_TOTAL = R - 2

  /* ===== En-tête ===== */
  pdf.setFont('helvetica', 'bolditalic')
  pdf.setFontSize(20)
  pdf.setTextColor(...DARK)
  pdf.text('Mon', M, y + 6)
  pdf.setTextColor(...ACCENT)
  pdf.text('ity', M + pdf.getTextWidth('Mon'), y + 6)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(34)
  pdf.setTextColor(...DARK)
  pdf.text('FACTURE', M, y + 22)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(`Facture n° ${invoice.id}`, R, y + 4, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...GRAY)
  pdf.text(`Date : ${fmtDate(invoice.invoiceDate)}`, R, y + 11, { align: 'right' })
  pdf.text(`Date d'échéance : ${fmtDate(invoice.dueDate)}`, R, y + 17, { align: 'right' })

  y += 32

  /* ===== Émetteur / Client ===== */
  const COL_W = 80
  const drawParty = (
    label: string,
    name: string,
    address: string,
    x: number,
    align: 'left' | 'right'
  ): number => {
    let yy = y
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...GRAY)
    pdf.text(label.toUpperCase(), x, yy, { align })
    yy += 5

    pdf.setFont('helvetica', 'bolditalic')
    pdf.setFontSize(11)
    pdf.setTextColor(...DARK)
    const nameLines = pdf.splitTextToSize(name || '-', COL_W) as string[]
    pdf.text(nameLines, x, yy, { align })
    yy += nameLines.length * 5

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...GRAY)
    const addrLines = pdf.splitTextToSize(address || '', COL_W) as string[]
    if (addrLines.length > 0 && addrLines[0] !== '') {
      pdf.text(addrLines, x, yy, { align })
      yy += addrLines.length * 4.2
    }
    return yy
  }

  const leftBottom = drawParty('Émetteur', invoice.issuerName, invoice.issuerAddress, M, 'left')
  const rightBottom = drawParty('Client', invoice.clientName, invoice.clientAddress, R, 'right')
  y = Math.max(leftBottom, rightBottom) + 10

  /* ===== Tableau des lignes ===== */
  const drawTableHeader = () => {
    pdf.setFillColor(...LIGHT)
    pdf.rect(M, y, R - M, 8, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...DARK)
    pdf.text('#', COL_NUM, y + 5.4)
    pdf.text('Description', COL_DESC, y + 5.4)
    pdf.text('Qté', COL_QTY, y + 5.4, { align: 'right' })
    pdf.text('Prix unitaire', COL_PU, y + 5.4, { align: 'right' })
    pdf.text('Total', COL_TOTAL, y + 5.4, { align: 'right' })
    y += 8
  }

  drawTableHeader()

  const lines = invoice.lines || []

  if (lines.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...GRAY)
    pdf.text('Aucune ligne de facture', W / 2, y + 7, { align: 'center' })
    y += 12
  }

  lines.forEach((line, index) => {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const descLines = pdf.splitTextToSize(line.description || '', DESC_W) as string[]
    const rowH = Math.max(8, descLines.length * 4.4 + 4)

    // Saut de page propre : une ligne n'est jamais coupée en deux
    if (y + rowH > H - M - 12) {
      pdf.addPage()
      y = M
      drawTableHeader()
    }

    if (index % 2 === 1) {
      pdf.setFillColor(...LIGHT)
      pdf.rect(M, y, R - M, rowH, 'F')
    }

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...DARK)
    const ty = y + 5.4
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
  const needed = 40 + (invoice.vatActive ? 7 : 0) + (hasAdvance ? 36 : 0)
  if (y + needed > H - M - 8) {
    pdf.addPage()
    y = M
  }

  const LABEL_X = M + 100
  y += 10

  const row = (label: string, value: string) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...DARK)
    pdf.text(label, LABEL_X, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, R, y, { align: 'right' })
    y += 7
  }

  const badgeRow = (label: string, value: string, color: RGB) => {
    y += 3
    pdf.setDrawColor(...LINE)
    pdf.line(LABEL_X, y - 4, R, y - 4)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    const w = pdf.getTextWidth(value) + 8
    pdf.setFillColor(...color)
    pdf.roundedRect(R - w, y - 2.6, w, 8, 4, 4, 'F')
    pdf.setTextColor(...DARK)
    pdf.text(label, LABEL_X, y + 2.6)
    pdf.text(value, R - 4, y + 2.6, { align: 'right' })
    y += 11
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
      pdf.setFontSize(9)
      pdf.setTextColor(...GRAY)
      pdf.text('Reste à payer avant le', LABEL_X, y)
      pdf.text(fmtDate(invoice.dueDate), R, y, { align: 'right' })
      y += 6
    }
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