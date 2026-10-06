import { Invoice } from '@/type'

// Nombre de jours par défaut pour payer l'avance, à partir de la date de facture
export const DEFAULT_ADVANCE_DELAY_DAYS = 7

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