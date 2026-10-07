import React from 'react'
import type { TemplateId } from '@/lib/invoicePdf'
import ClassicPreview from './ClassicPreview'
import CreativePreview from './CreativePreview'
import StudioPreview from './StudioPreview'
import GreenPreview from './GreenPreview'
import RedPreview from './RedPreview'
import BannerPreview from './BannerPreview'
import { PreviewProps } from './shared'

// Pour un nouveau modèle : crée son aperçu dans previews/ puis ajoute une ligne ici
const PREVIEWS: Record<TemplateId, React.FC<PreviewProps>> = {
    classic: ClassicPreview,
    creative: CreativePreview,
    studio: StudioPreview,
    green: GreenPreview,
    red: RedPreview,
    banner: BannerPreview,
}

const InvoicePreview: React.FC<PreviewProps & { templateId: TemplateId }> = ({ templateId, invoice, totals }) => {
    const Preview = PREVIEWS[templateId] ?? ClassicPreview
    return <Preview invoice={invoice} totals={totals} />
}

export default InvoicePreview