import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { buildInvoicePdf, PDF_TEMPLATES, TemplateId } from '@/lib/invoicePdf'
import confetti from 'canvas-confetti'
import type jsPDF from 'jspdf'
import { Layers, Download, Eye, Send } from 'lucide-react'
import React, { useState } from 'react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

interface FactureContentProps {
    invoice: Invoice
    totals: Totals
    formatDate: (dateString: string) => string
    isDesktop?: boolean
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

const FactureContent: React.FC<FactureContentProps> = ({ invoice, totals, formatDate, isDesktop = false }) => {

    const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
    const hasAdvance = advance > 0

    if (isDesktop) {
        return (
            <>
                <div className='flex justify-between items-center text-sm'>
                    <div className='flex flex-col'>
                        <div>
                            <div className='flex items-center'>
                                <div className='bg-accent-content text-accent rounded-full p-2'>
                                    <Layers className='h-6 w-6' />
                                </div>
                                <span className='ml-3 font-bold text-2xl italic'>
                                    Mon<span className='text-accent'>ity</span>
                                </span>
                            </div>
                        </div>
                        <h1 className='text-7xl font-bold uppercase'>Facture</h1>
                    </div>
                    <div className='text-right uppercase'>
                        <p className='badge badge-ghost'>
                            Facture ° {invoice.id}
                        </p>
                        <p className='my-2'>
                            <strong>Date </strong>
                            {formatDate(invoice.invoiceDate)}
                        </p>
                        <p>
                            <strong>Date d&apos;échéance </strong>
                            {formatDate(invoice.dueDate)}
                        </p>
                    </div>
                </div>

                <div className='my-6 flex justify-between gap-4'>
                    <div className='min-w-0'>
                        <p className='badge badge-ghost mb-2'>Émetteur</p>
                        <p className='text-sm font-bold italic break-words'>{invoice.issuerName}</p>
                        <p className='text-sm text-gray-500 w-52 max-w-full break-words whitespace-pre-line'>{invoice.issuerAddress}</p>
                    </div>
                    <div className='text-right min-w-0'>
                        <p className='badge badge-ghost mb-2'>Client</p>
                        <p className='text-sm font-bold italic break-words'>{invoice.clientName}</p>
                        <p className='text-sm text-gray-500 w-52 max-w-full break-words whitespace-pre-line'>{invoice.clientAddress}</p>
                    </div>
                </div>

                <div className='overflow-x-auto'>
                    <table className='table table-zebra'>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Description</th>
                                <th>Quantité</th>
                                <th>Prix Unitaire</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lines && invoice.lines.length > 0 ? (
                                invoice.lines.map((ligne: { description: string; quantity: number; unitPrice: number }, index: number) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td className='max-w-xs whitespace-normal break-words'>{ligne.description}</td>
                                        <td>{ligne.quantity}</td>
                                        <td>{ligne.unitPrice.toFixed(2)} FCFA</td>
                                        <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} FCFA</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center">Aucune ligne de facture</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='mt-6 space-y-2 text-md'>
                    <div className='flex justify-between'>
                        <span className='font-bold'>Total Hors Taxes</span>
                        <span>{totals.totalHT.toFixed(2)} FCFA</span>
                    </div>

                    {invoice.vatActive && (
                        <div className='flex justify-between'>
                            <span className='font-bold'>TVA {invoice.vatRate} %</span>
                            <span>{totals.totalVAT.toFixed(2)} FCFA</span>
                        </div>
                    )}

                    <div className='flex justify-between border-t pt-2 mt-2'>
                        <span className='font-bold'>Total TTC</span>
                        <span className='badge badge-accent badge-lg'>
                            {totals.totalTTC.toFixed(2)} FCFA
                        </span>
                    </div>

                    {hasAdvance && (
                        <>
                            <div className='flex justify-between gap-4'>
                                <span className='font-bold'>
                                    Avance versée{invoice.advanceDate ? ` le ${formatDate(invoice.advanceDate)}` : ''}
                                </span>
                                <span className='whitespace-nowrap'>- {advance.toFixed(2)} FCFA</span>
                            </div>

                            <div className='flex justify-between border-t pt-2 mt-2'>
                                <span className='font-bold'>Reste à payer</span>
                                <span className='badge badge-warning badge-lg'>
                                    {remaining.toFixed(2)} FCFA
                                </span>
                            </div>

                            {invoice.dueDate && (
                                <div className='flex justify-between gap-4 text-sm text-gray-500'>
                                    <span>Reste à payer avant le</span>
                                    <span className='whitespace-nowrap'>{formatDate(invoice.dueDate)}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </>
        )
    }

    // Version mobile
    return (
        <>
            <div className='flex flex-col space-y-4'>
                <div className='flex justify-between items-start'>
                    <div className='flex flex-col'>
                        <div className='flex items-center'>
                            <div className='bg-accent-content text-accent rounded-full p-1.5'>
                                <Layers className='h-5 w-5' />
                            </div>
                            <span className='ml-2 font-bold text-xl italic'>
                                Mon<span className='text-accent'>ity</span>
                            </span>
                        </div>
                        <h1 className='text-3xl font-bold uppercase mt-1'>Facture</h1>
                    </div>
                    <div className='text-right text-xs'>
                        <p className='badge badge-ghost badge-sm'>
                            N° {invoice.id}
                        </p>
                    </div>
                </div>

                <div className='flex justify-between gap-2 text-xs bg-gray-50 p-2 rounded'>
                    <p>
                        <span className='font-bold'>Date:</span> {formatDate(invoice.invoiceDate)}
                    </p>
                    <p>
                        <span className='font-bold'>Échéance:</span> {formatDate(invoice.dueDate)}
                    </p>
                </div>
            </div>

            <div className='my-4 space-y-3'>
                <div className='bg-gray-50 p-2 rounded min-w-0'>
                    <p className='badge badge-ghost badge-xs mb-1'>Émetteur</p>
                    <p className='text-xs font-bold italic break-words'>{invoice.issuerName}</p>
                    <p className='text-xs text-gray-500 break-words whitespace-pre-line'>{invoice.issuerAddress}</p>
                </div>
                <div className='bg-gray-50 p-2 rounded min-w-0'>
                    <p className='badge badge-ghost badge-xs mb-1'>Client</p>
                    <p className='text-xs font-bold italic break-words'>{invoice.clientName}</p>
                    <p className='text-xs text-gray-500 break-words whitespace-pre-line'>{invoice.clientAddress}</p>
                </div>
            </div>

            <div className='overflow-x-auto -mx-4 px-4'>
                <table className='table table-zebra table-xs'>
                    <thead>
                        <tr>
                            <th className='text-xs'>#</th>
                            <th className='text-xs'>Description</th>
                            <th className='text-xs text-right'>Qté</th>
                            <th className='text-xs text-right'>P.U</th>
                            <th className='text-xs text-right'>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.lines && invoice.lines.length > 0 ? (
                            invoice.lines.map((ligne: { description: string; quantity: number; unitPrice: number }, index: number) => (
                                <tr key={index} className='text-xs'>
                                    <td>{index + 1}</td>
                                    <td className='max-w-[140px] whitespace-normal break-words'>
                                        {ligne.description}
                                    </td>
                                    <td className='text-right'>{ligne.quantity}</td>
                                    <td className='text-right'>{ligne.unitPrice.toFixed(0)}</td>
                                    <td className='text-right font-medium'>
                                        {(ligne.quantity * ligne.unitPrice).toFixed(0)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center text-xs">Aucune ligne</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className='mt-4 space-y-1.5 text-sm border-t pt-3'>
                <div className='flex justify-between text-xs'>
                    <span>Total HT</span>
                    <span className='font-medium'>{totals.totalHT.toFixed(0)} FCFA</span>
                </div>

                {invoice.vatActive && (
                    <div className='flex justify-between text-xs'>
                        <span>TVA {invoice.vatRate}%</span>
                        <span className='font-medium'>{totals.totalVAT.toFixed(0)} FCFA</span>
                    </div>
                )}

                <div className='flex justify-between text-sm font-bold mt-2 pt-1 border-t'>
                    <span>Total TTC</span>
                    <span className='badge badge-accent badge-sm'>
                        {totals.totalTTC.toFixed(0)} FCFA
                    </span>
                </div>

                {hasAdvance && (
                    <>
                        <div className='flex justify-between gap-2 text-xs'>
                            <span>
                                Avance{invoice.advanceDate ? ` (${formatDate(invoice.advanceDate)})` : ''}
                            </span>
                            <span className='font-medium whitespace-nowrap'>- {advance.toFixed(0)} FCFA</span>
                        </div>

                        <div className='flex justify-between text-sm font-bold pt-1 border-t'>
                            <span>Reste à payer</span>
                            <span className='badge badge-warning badge-sm'>
                                {remaining.toFixed(0)} FCFA
                            </span>
                        </div>

                        {invoice.dueDate && (
                            <div className='flex justify-between gap-2 text-xs text-gray-500'>
                                <span>Reste à payer avant le</span>
                                <span className='whitespace-nowrap'>{formatDate(invoice.dueDate)}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {

    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [isViewMode, setIsViewMode] = useState<boolean>(false)
    const [templateId, setTemplateId] = useState<TemplateId>('classic')

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

    const toggleViewMode = (): void => {
        setIsViewMode(!isViewMode)
    }

    const templateSelect = (
        <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as TemplateId)}
            className='select select-bordered select-sm'
            aria-label='Modèle de PDF'
        >
            {PDF_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
            ))}
        </select>
    )

    return (
    <>
        {/* Version mobile / tablette */}
        <div className='mt-4 block lg:hidden min-w-0'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-4'>
                <div className='flex flex-wrap gap-2 mb-4'>
                    <div className='w-full'>{templateSelect}</div>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent flex-1 min-w-[100px]'>
                        <Download className="w-4 mr-1" />
                        {isGenerating ? '...' : 'Télécharger'}
                    </button>
                    <button
                        onClick={handleViewPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-primary flex-1 min-w-[100px]'>
                        <Eye className="w-4 mr-1" />
                        {isGenerating ? '...' : 'Visualiser'}
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isGenerating}
                        className='btn btn-sm btn-info flex-1 min-w-[100px]'>
                        <Send className="w-4 mr-1" />
                        {isGenerating ? '...' : 'Envoyer'}
                    </button>
                </div>

                <button
                    onClick={toggleViewMode}
                    className='btn btn-xs btn-ghost w-full mb-2 text-xs'>
                    {isViewMode ? 'Réduire' : 'Voir en plein écran'}
                </button>

                {isViewMode ? (
                    <div className='fixed inset-0 z-50 bg-white overflow-y-auto'>
                        <div className='sticky top-0 bg-white border-b p-2 flex justify-between items-center z-10'>
                            <h2 className='font-bold'>Aperçu facture</h2>
                            <div className='flex gap-2'>
                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={isGenerating}
                                    className='btn btn-xs btn-accent'>
                                    <Download className="w-3" />
                                </button>
                                <button
                                    onClick={handleSend}
                                    disabled={isGenerating}
                                    className='btn btn-xs btn-info'>
                                    <Send className="w-3" />
                                </button>
                                <button
                                    onClick={toggleViewMode}
                                    className='btn btn-xs btn-ghost'>
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className='p-4 bg-white'>
                            <FactureContent invoice={invoice} totals={totals} formatDate={formatDate} />
                        </div>
                    </div>
                ) : (
                    <div className='p-4 bg-white rounded-lg max-h-[600px] md:max-h-none overflow-y-auto'>
                        <FactureContent invoice={invoice} totals={totals} formatDate={formatDate} />
                    </div>
                )}

                <p className='text-xs text-gray-500 mt-3 text-center'>
                    Le PDF généré inclura toute la facture
                </p>
            </div>
        </div>

        {/* Version desktop */}
        <div className='mt-4 hidden lg:block min-w-0'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>
                <div className='flex flex-wrap items-center gap-2 mb-4'>
                    {templateSelect}
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent'>
                        {isGenerating ? 'Génération...' : 'Facture PDF'}
                        <Download className="w-4" />
                    </button>
                    <button
                        onClick={handleViewPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-primary'>
                        Visualiser
                        <Eye className="w-4" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isGenerating}
                        className='btn btn-sm btn-info'>
                        <Send className="w-4 mr-1" />
                        {isGenerating ? 'Préparation...' : 'Envoyer'}
                    </button>
                </div>

                <div className='p-8 bg-white rounded-lg'>
                    <FactureContent
                        invoice={invoice}
                        totals={totals}
                        formatDate={formatDate}
                        isDesktop={true}
                    />
                </div>

                <p className='text-sm text-gray-500 mt-4 text-center'>
                    Le PDF généré inclura toute la facture
                </p>
            </div>
        </div> 
    </>
)
}

export default InvoicePDF