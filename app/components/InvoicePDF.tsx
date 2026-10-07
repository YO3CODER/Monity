import { Invoice, Totals } from '@/type'
import { buildInvoicePdf, PDF_TEMPLATES, TemplateId } from '@/lib/invoicePdf'
import confetti from 'canvas-confetti'
import type jsPDF from 'jspdf'
import { Download, Eye, Send, Maximize2, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

const STORAGE_KEY = 'invoice-template'

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {

    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
    const [templateId, setTemplateId] = useState<TemplateId>('classic')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true)
    const urlRef = useRef<string | null>(null)

    // Récupère le dernier modèle utilisé
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved && PDF_TEMPLATES.some((t) => t.id === saved)) {
                setTemplateId(saved as TemplateId)
            }
        } catch {
            // stockage indisponible : on garde le modèle par défaut
        }
    }, [])

    const changeTemplate = (id: TemplateId) => {
        setTemplateId(id)
        try {
            localStorage.setItem(STORAGE_KEY, id)
        } catch {
            // ignoré
        }
    }

    // Génère l'aperçu (le vrai PDF) à chaque modification, avec un léger délai
    useEffect(() => {
        let cancelled = false
        setIsPreviewLoading(true)

        const timer = setTimeout(async () => {
            try {
                const pdf = await buildInvoicePdf(invoice, totals, templateId)
                if (cancelled) return
                const url = URL.createObjectURL(pdf.output('blob'))
                if (urlRef.current) URL.revokeObjectURL(urlRef.current)
                urlRef.current = url
                setPreviewUrl(url)
            } catch (error) {
                console.error("Erreur lors de la génération de l'aperçu :", error)
            } finally {
                if (!cancelled) setIsPreviewLoading(false)
            }
        }, 400)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [invoice, totals, templateId])

    // Libère la mémoire à la fermeture
    useEffect(() => {
        return () => {
            if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        }
    }, [])

    const generatePDF = async (): Promise<jsPDF> => {
        return buildInvoicePdf(invoice, totals, templateId)
    }

    const fileName = `facture-${invoice.name || invoice.id}.pdf`

    const handleDownloadPdf = async (): Promise<void> => {
        if (isGenerating) return

        try {
            setIsGenerating(true)
            const pdf = await generatePDF()
            pdf.save(fileName)
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            })
        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
            alert('Une erreur est survenue lors de la génération du PDF');
        } finally {
            setIsGenerating(false)
        }
    }

    const handleViewPdf = async (): Promise<void> => {
        if (isGenerating) return

        try {
            setIsGenerating(true)
            const pdf = await generatePDF()
            const pdfBlob = pdf.output('blob')
            const pdfUrl = URL.createObjectURL(pdfBlob)
            window.open(pdfUrl, '_blank')
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000)
        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
            alert('Une erreur est survenue lors de la génération du PDF');
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSend = async (): Promise<void> => {
        if (isGenerating) return

        try {
            setIsGenerating(true)
            const pdf = await generatePDF()
            const pdfBlob = pdf.output('blob')
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: `Facture ${invoice.name || invoice.id}`,
                    text: `Facture de ${invoice.issuerName} pour ${invoice.clientName}`,
                    files: [pdfFile]
                })
            } else {
                const pdfUrl = URL.createObjectURL(pdfBlob)
                const link = document.createElement('a')
                link.href = pdfUrl
                link.download = fileName
                link.click()

                alert('PDF téléchargé.\n\nVous pouvez maintenant l\'envoyer par email, WhatsApp ou tout autre moyen.')

                setTimeout(() => {
                    URL.revokeObjectURL(pdfUrl)
                }, 2000)
            }
        } catch (error) {
            // Annulation du partage par l'utilisateur : rien à faire
            if (error instanceof DOMException && error.name === 'AbortError') return

            console.error('Erreur lors de l\'envoi :', error);
            alert('Impossible de partager.\n\nVeuillez télécharger le PDF et le partager manuellement.');
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className={isFullscreen ? 'fixed inset-0 z-50 bg-base-100 p-3 flex flex-col' : 'mt-4 min-w-0'}>
            <div className={`border-base-300 border-2 border-dashed rounded-xl p-3 md:p-5 ${isFullscreen ? 'flex flex-col flex-1 min-h-0' : ''}`}>

                {/* Barre d'outils */}
                <div className='flex flex-wrap items-center gap-2 mb-4'>
                    <select
                        value={templateId}
                        onChange={(e) => changeTemplate(e.target.value as TemplateId)}
                        className='select select-bordered select-sm w-full sm:w-auto'
                        aria-label='Modèle de PDF'
                    >
                        {PDF_TEMPLATES.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent flex-1 sm:flex-none'>
                        <Download className="w-4" />
                        {isGenerating ? '...' : 'Télécharger'}
                    </button>
                    <button
                        onClick={handleViewPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-primary flex-1 sm:flex-none'>
                        <Eye className="w-4" />
                        Ouvrir
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isGenerating}
                        className='btn btn-sm btn-info flex-1 sm:flex-none'>
                        <Send className="w-4" />
                        {isGenerating ? '...' : 'Envoyer'}
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className='btn btn-sm btn-ghost'
                        aria-label={isFullscreen ? "Quitter le plein écran" : 'Plein écran'}>
                        {isFullscreen ? <X className="w-4" /> : <Maximize2 className="w-4" />}
                    </button>
                </div>

                {/* Aperçu : le vrai PDF du modèle choisi */}
                <div className={`relative rounded-lg overflow-hidden bg-white ${isFullscreen ? 'flex-1 min-h-0' : 'h-[70vh] min-h-[420px]'}`}>
                    {previewUrl && (
                        <iframe
                            src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                            title='Aperçu de la facture'
                            className='w-full h-full border-0'
                        />
                    )}

                    {isPreviewLoading && (
                        <div className='absolute inset-0 flex items-center justify-center bg-white/70'>
                            <span className='loading loading-spinner loading-md text-yellow-500'></span>
                        </div>
                    )}
                </div>

                <p className='text-xs text-gray-500 mt-3 text-center'>
                    L&apos;aperçu est identique au PDF téléchargé. Si rien ne s&apos;affiche sur ton téléphone, utilise « Ouvrir ».
                </p>
            </div>
        </div>
    )
}

export default InvoicePDF