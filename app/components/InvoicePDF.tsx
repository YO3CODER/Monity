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
                    windowWidth: 1200 // Force une largeur fixe pour un rendu cohérent
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
        <>
            {/* Version mobile : bouton flottant */}
            <div className='fixed bottom-6 right-6 z-50 lg:hidden'>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGenerating}
                    className='btn btn-accent btn-circle shadow-lg hover:shadow-xl transition-all w-14 h-14'
                    title="Télécharger la facture PDF"
                >
                    {isGenerating ? (
                        <span className="loading loading-spinner loading-md"></span>
                    ) : (
                        <ArrowDownFromLine className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Version mobile : bouton en bas (alternative, décommentez si préféré) */}
            {/* <div className='fixed bottom-0 left-0 right-0 lg:hidden bg-base-100 border-t border-base-300 p-4 shadow-lg z-50'>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGenerating}
                    className='btn btn-accent w-full'
                >
                    {isGenerating ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Génération du PDF...
                        </>
                    ) : (
                        <>
                            <ArrowDownFromLine className="w-4 mr-2" />
                            Télécharger la facture PDF
                        </>
                    )}
                </button>
            </div> */}

            {/* Version desktop : affichage normal */}
            <div className='mt-4 hidden lg:block'>
                <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className='btn btn-sm btn-accent mb-4'>
                        {isGenerating ? 'Génération...' : 'Facture PDF'}
                        <ArrowDownFromLine className="w-4" />
                    </button>

                    <div className='p-8 bg-white rounded-lg' ref={factureRef}>
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

                        <div className='my-6 flex justify-between'>
                            <div>
                                <p className='badge badge-ghost mb-2'>Émetteur</p>
                                <p className='text-sm font-bold italic'>{invoice.issuerName}</p>
                                <p className='text-sm text-gray-500 w-52 break-words'>{invoice.issuerAddress}</p>
                            </div>
                            <div className='text-right'>
                                <p className='badge badge-ghost mb-2'>Client</p>
                                <p className='text-sm font-bold italic'>{invoice.clientName}</p>
                                <p className='text-sm text-gray-500 w-52 break-words'>{invoice.clientAddress}</p>
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
                                        invoice.lines.map((ligne, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{ligne.description}</td>
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
                        </div>
                    </div>

                    <p className='text-sm text-gray-500 mt-4 text-center'>
                        💡 Si le PDF est tronqué, diminuez le zoom de la page avant de télécharger
                    </p>
                </div>
            </div>

            {/* Message pour mobile (optionnel) */}
            <div className='lg:hidden text-center mt-4 text-sm text-gray-500'>
                <p>Le bouton flottant en bas à droite vous permet de télécharger la facture</p>
            </div>
        </>
    )
}

export default InvoicePDF