export type RGB = [number, number, number]

// Montant avec espace normale (l'espace fine insécable de fr-FR n'est pas rendue par jsPDF)
export function money(n: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
  return formatted.replace(/[\u202F\u00A0]/g, ' ') + ' FCFA'
}

// Nombre brut : entier tel quel, sinon 2 décimales
export function num(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

// Date au format "05 oct. 2026" (lecture manuelle pour éviter tout décalage de fuseau)
export function fmtDate(value?: string): string {
  if (!value) return '-'
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return '-'
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}