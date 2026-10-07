import React from 'react'
import type { TemplateId } from '@/lib/invoicePdf'
import { PreviewProps } from './previews/shared'
import ClassicPreview from './previews/ClassicPreview'
import CreativePreview from './previews/CreativePreview'
import StudioPreview from './previews/StudioPreview'
import GreenPreview from './previews/GreenPreview'
import RedPreview from './previews/RedPreview'
import BannerPreview from './previews/BannerPreview'

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