import { Invoice } from '@/type'

// Nombre de jours par défaut pour payer l'avance, à partir de la date de facture
export const DEFAULT_ADVANCE_DELAY_DAYS = 7

// Statuts des factures (à adapter si tes valeurs sont différentes)
export const STATUS_DRAFT = 1
export const STATUS_PENDING = 2
export const STATUS_PAID = 3
export const STATUS_CANCELLED = 4
export const STATUS_UNPAID = 5

// Ajoute des jours à une date au format YYYY-MM-DD (sans décalage de fuseau horaire)
export function addDays(date: string, days: number): string {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return ''
  const result = new Date(Date.UTC(y, m - 1, d + days))
  return result.toISOString().slice(0, 10)
}

// Calcule l'avance retenue et le reste à payer (l'avance ne dépasse jamais le total)
export function computeBalance(totalTTC: number, advance?: number | null) {
  const paid = Math.min(Math.max(advance ?? 0, 0), totalTTC)
  return {
    advance: paid,
    remaining: totalTTC - paid,
  }
}

// Date limite de paiement de l'avance :
// celle saisie si elle existe, sinon date de facture + délai par défaut
export function getAdvanceDueDate(invoice: Invoice): string {
  return invoice.advanceDueDate || addDays(invoice.invoiceDate, DEFAULT_ADVANCE_DELAY_DAYS)
}

// Total TTC d'une facture, calculé à partir de ses lignes et de la TVA
export function getInvoiceTotalTTC(invoice: Invoice): number {
  const lines = invoice.lines ?? []
  const totalHT = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
    0
  )
  const vat = invoice.vatActive ? (totalHT * (Number(invoice.vatRate) || 0)) / 100 : 0
  return totalHT + vat
}

// Argent gagné (déjà encaissé) et argent à encaisser, sur l'ensemble des factures
export function computeEarnings(invoices: Invoice[]) {
  let earned = 0
  let toCollect = 0

  for (const invoice of invoices) {
    // Les brouillons et les factures annulées ne comptent pas
    if (invoice.status === STATUS_DRAFT || invoice.status === STATUS_CANCELLED) continue

    const total = getInvoiceTotalTTC(invoice)

    if (invoice.status === STATUS_PAID) {
      earned += total
      continue
    }

    // En attente ou impayée : l'avance est déjà gagnée, le reste est à encaisser
    const { advance, remaining } = computeBalance(total, invoice.advance)
    earned += advance
    toCollect += remaining
  }

  return { earned, toCollect }
}