import type jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { buildClassicPdf } from '@/lib/pdfTemplates/classic'
import { buildCreativePdf } from '@/lib/pdfTemplates/creative'

export type TemplateId = 'classic' | 'creative'

// Pour ajouter un modèle : crée son fichier, puis ajoute une ligne ici et dans BUILDERS
export const PDF_TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic', label: 'Modèle 1' },
  { id: 'creative', label: 'Modèle 2' },
]

const BUILDERS: Record<TemplateId, (invoice: Invoice, totals: Totals) => Promise<jsPDF>> = {
  classic: buildClassicPdf,
  creative: buildCreativePdf,
}

export async function buildInvoicePdf(
  invoice: Invoice,
  totals: Totals,
  templateId: TemplateId = 'classic'
): Promise<jsPDF> {
  const build = BUILDERS[templateId] ?? BUILDERS.classic
  return build(invoice, totals)
}