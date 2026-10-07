import type jsPDF from 'jspdf'
import { Invoice, Totals } from '@/type'
import { buildClassicPdf } from '@/lib/pdfTemplates/classic'
import { buildCreativePdf } from '@/lib/pdfTemplates/creative'
import { buildStudioPdf } from '@/lib/pdfTemplates/studio'
import { buildGreenPdf } from '@/lib/pdfTemplates/green'
import { buildRedPdf } from '@/lib/pdfTemplates/red'
import { buildBannerPdf } from '@/lib/pdfTemplates/banner'

export type TemplateId = 'classic' | 'creative' | 'studio' | 'green' | 'red' | 'banner'

// Pour ajouter un modèle : crée son fichier, puis ajoute une ligne ici et dans BUILDERS
export const PDF_TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'classic', label: 'Modèle 1' },
  { id: 'creative', label: 'Modèle 2' },
  { id: 'studio', label: 'Modèle 3' },
  { id: 'green', label: 'Modèle 4' },
  { id: 'red', label: 'Modèle 5' },
  { id: 'banner', label: 'Modèle 6' },
]

const BUILDERS: Record<TemplateId, (invoice: Invoice, totals: Totals) => Promise<jsPDF>> = {
  classic: buildClassicPdf,
  creative: buildCreativePdf,
  studio: buildStudioPdf,
  green: buildGreenPdf,
  red: buildRedPdf,
  banner: buildBannerPdf,
}

export async function buildInvoicePdf(
  invoice: Invoice,
  totals: Totals,
  templateId: TemplateId = 'classic'
): Promise<jsPDF> {
  const build = BUILDERS[templateId] ?? BUILDERS.classic
  return build(invoice, totals)
}