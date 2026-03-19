import { Invoice, Totals } from '@/type'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine, Layers } from 'lucide-react'
import React, { useRef, useState } from 'react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {

    const factureRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownloadPdf = async () => {
        const element = factureRef.current
        if (element && !isGenerating) {
            try {
                setIsGenerating(true)

                const canvas = await html2canvas(element, { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: false,
                    windowWidth: 1200
                })
                
                const imgData = canvas.toDataURL('image/png')

                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "A4"
                })

                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                pdf.save(`facture-${invoice.name || invoice.id}.pdf`)

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
    }

    return (
        <div className='mt-4'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>
                
                {/* Bouton de téléchargement - visible sur tous les écrans */}
                <div className='flex justify-end mb-4'>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-accent'>
                        {isGenerating ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Génération...
                            </>
                        ) : (
                            <>
                                Télécharger la facture PDF
                                <ArrowDownFromLine className="w-4 ml-2" />
                            </>
                        )}
                    </button>
                </div>

                {/* Facture - maintenant visible sur tous les écrans */}
                <div className='p-4 sm:p-8 bg-white rounded-lg overflow-x-auto' ref={factureRef}>
                    {/* Version mobile adaptative */}
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm'>
                        <div className='flex flex-col w-full sm:w-auto'>
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
                            <h1 className='text-4xl sm:text-7xl font-bold uppercase mt-2'>Facture</h1>
                        </div>
                        <div className='text-left sm:text-right uppercase w-full sm:w-auto'>
                            <p className='badge badge-ghost mb-2'>
                                Facture ° {invoice.id}
                            </p>
                            <p className='my-1'>
                                <strong>Date </strong>
                                {formatDate(invoice.invoiceDate)}
                            </p>
                            <p>
                                <strong>Date d&apos;échéance </strong>
                                {formatDate(invoice.dueDate)}
                            </p>
                        </div>
                    </div>

                    {/* Émetteur et Client - adaptatif */}
                    <div className='my-6 flex flex-col sm:flex-row justify-between gap-4'>
                        <div>
                            <p className='badge badge-ghost mb-2'>Émetteur</p>
                            <p className='text-sm font-bold italic'>{invoice.issuerName}</p>
                            <p className='text-sm text-gray-500 break-words max-w-xs'>{invoice.issuerAddress}</p>
                        </div>
                        <div className='sm:text-right'>
                            <p className='badge badge-ghost mb-2'>Client</p>
                            <p className='text-sm font-bold italic'>{invoice.clientName}</p>
                            <p className='text-sm text-gray-500 break-words max-w-xs'>{invoice.clientAddress}</p>
                        </div>
                    </div>

                    {/* Tableau des lignes de facture */}
                    <div className='overflow-x-auto -mx-4 sm:mx-0'>
                        <div className='inline-block min-w-full align-middle'>
                            <table className='table table-zebra w-full'>
                                <thead>
                                    <tr>
                                        <th className='text-xs sm:text-sm'></th>
                                        <th className='text-xs sm:text-sm'>Description</th>
                                        <th className='text-xs sm:text-sm'>Qté</th>
                                        <th className='text-xs sm:text-sm'>Prix Unitaire</th>
                                        <th className='text-xs sm:text-sm'>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lines && invoice.lines.length > 0 ? (
                                        invoice.lines.map((ligne, index) => (
                                            <tr key={index}>
                                                <td className='text-xs sm:text-sm'>{index + 1}</td>
                                                <td className='text-xs sm:text-sm'>{ligne.description}</td>
                                                <td className='text-xs sm:text-sm'>{ligne.quantity}</td>
                                                <td className='text-xs sm:text-sm'>{ligne.unitPrice.toFixed(2)} FCFA</td>
                                                <td className='text-xs sm:text-sm'>{(ligne.quantity * ligne.unitPrice).toFixed(2)} FCFA</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="text-center text-xs sm:text-sm">Aucune ligne de facture</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totaux */}
                    <div className='mt-6 space-y-2 text-sm sm:text-md'>
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
                            <span className='badge badge-accent badge-sm sm:badge-lg'>
                                {totals.totalTTC.toFixed(2)} FCFA
                            </span>
                        </div>
                    </div>
                </div>

                <p className='text-sm text-gray-500 mt-4 text-center'>
                    💡 Si le PDF est tronqué, diminuez le zoom de la page avant de télécharger
                </p>
            </div>
        </div>
    )
}

export default InvoicePDF