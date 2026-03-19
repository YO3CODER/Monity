import { Invoice, Totals } from '@/type'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine, Layers } from 'lucide-react'
import React, { useRef } from 'react'

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

    const handleDownloadPdf = async () => {
        const element = factureRef.current
        if (element) {
            try {
                // Configuration du PDF
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "A4"
                })

                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = pdf.internal.pageSize.getHeight()

                // Capturer l'élément entier
                const canvas = await html2canvas(element, { 
                    scale: 2, // Réduire légèrement l'échelle pour améliorer les performances
                    useCORS: true,
                    logging: false,
                    windowWidth: 1200 // Largeur fixe pour la cohérence
                })
                
                const imgData = canvas.toDataURL('image/png')
                
                // Calculer les dimensions de l'image par rapport au PDF
                const imgWidth = pdfWidth
                const imgHeight = (canvas.height * pdfWidth) / canvas.width
                
                let heightLeft = imgHeight
                let position = 0
                let page = 1

                // Ajouter la première page
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                
                // Si l'image est plus grande que la page, ajouter des pages supplémentaires
                while (heightLeft > pdfHeight) {
                    position = position - pdfHeight
                    pdf.addPage()
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                    heightLeft -= pdfHeight
                    page++
                }

                // Sauvegarder le PDF
                pdf.save(`facture-${invoice.name}.pdf`)

                // Confetti pour célébrer
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999
                })

            } catch (error) {
                console.error('Erreur lors de la génération du PDF :', error);
            }
        }
    }

    return (
        <div className='mt-4 hidden lg:block'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>

                <button
                    onClick={handleDownloadPdf}
                    className='btn btn-sm btn-accent mb-4'>
                    Facture PDF
                    <ArrowDownFromLine className="w-4" />
                </button>

                <div className='p-8' ref={factureRef}>

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
                            <p className='badge badge-ghost '>
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
                                {invoice.lines.map((ligne, index) => (
                                    <tr key={index + 1}>
                                        <td>{index + 1}</td>
                                        <td>{ligne.description}</td>
                                        <td>{ligne.quantity}</td>
                                        <td>{ligne.unitPrice.toFixed(2)} FCFA</td>
                                        <td>{(ligne.quantity * ligne.unitPrice).toFixed(2)} FCFA</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='mt-6 space-y-2 text-md'>
                        <div className='flex justify-between'>
                            <div className='font-bold'>
                                Total Hors Taxes
                            </div>
                            <div>
                                {totals.totalHT.toFixed(2)} FCFA
                            </div>
                        </div>

                        {invoice.vatActive && (
                            <div className='flex justify-between'>
                                <div className='font-bold'>
                                    TVA {invoice.vatRate} %
                                </div>
                                <div>
                                    {totals.totalVAT.toFixed(2)} FCFA
                                </div>
                            </div>
                        )}

                        <div className='flex justify-between'>
                            <div className='font-bold'>
                                Total Toutes Taxes Comprises
                            </div>
                            <div className='badge badge-accent'>
                                {totals.totalTTC.toFixed(2)} FCFA
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default InvoicePDF