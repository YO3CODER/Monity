// app/components/InvoicePDF.tsx
"use client"

import { Invoice, Totals } from '@/type'
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine, Layers } from 'lucide-react'
import React, { useRef, useState, useEffect } from 'react'

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
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

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

    if (!isClient) {
        return <div className="p-4">Chargement...</div>
    }

    return (
        <div className="w-full">
            {/* Version mobile : bouton en bas de l'écran */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-base-100 border-t border-base-300 shadow-lg">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGenerating}
                    className="btn btn-accent w-full"
                >
                    {isGenerating ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Génération en cours...
                        </>
                    ) : (
                        <>
                            <ArrowDownFromLine className="w-4 mr-2" />
                            Télécharger la facture
                        </>
                    )}
                </button>
            </div>

            {/* Contenu de la facture - TOUJOURS visible */}
            <div className="pb-24 lg:pb-0"> {/* Padding bottom pour éviter que le bouton mobile cache le contenu */}
                <div className="border-base-300 border-2 border-dashed rounded-xl p-3 sm:p-5">
                    
                    {/* Bouton desktop - visible seulement sur desktop */}
                    <div className="hidden lg:flex justify-end mb-4">
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isGenerating}
                            className="btn btn-sm btn-accent"
                        >
                            {isGenerating ? 'Génération...' : 'Facture PDF'}
                            <ArrowDownFromLine className="w-4 ml-2" />
                        </button>
                    </div>

                    {/* La facture */}
                    <div ref={factureRef} className="bg-white rounded-lg p-4 sm:p-6">
                        {/* En-tête */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-accent-content text-accent rounded-full p-2">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-2xl italic">
                                        Mon<span className="text-accent">ity</span>
                                    </span>
                                </div>
                                <h1 className="text-4xl sm:text-7xl font-bold uppercase">FACTURE</h1>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="badge badge-ghost mb-2">
                                    N° {invoice.id}
                                </p>
                                <p className="text-sm">
                                    <span className="font-bold">Date:</span> {formatDate(invoice.invoiceDate)}
                                </p>
                                <p className="text-sm">
                                    <span className="font-bold">Échéance:</span> {formatDate(invoice.dueDate)}
                                </p>
                            </div>
                        </div>

                        {/* Émetteur / Client */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="badge badge-ghost mb-2">ÉMETTEUR</p>
                                <p className="font-bold">{invoice.issuerName}</p>
                                <p className="text-sm text-gray-600">{invoice.issuerAddress}</p>
                            </div>
                            <div className="sm:text-right">
                                <p className="badge badge-ghost mb-2">CLIENT</p>
                                <p className="font-bold">{invoice.clientName}</p>
                                <p className="text-sm text-gray-600">{invoice.clientAddress}</p>
                            </div>
                        </div>

                        {/* Lignes de facture */}
                        <div className="overflow-x-auto mb-6">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th className="text-xs">#</th>
                                        <th className="text-xs">Description</th>
                                        <th className="text-xs text-right">Qté</th>
                                        <th className="text-xs text-right">Prix unit.</th>
                                        <th className="text-xs text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lines?.map((line, index) => (
                                        <tr key={index}>
                                            <td className="text-xs">{index + 1}</td>
                                            <td className="text-xs">{line.description}</td>
                                            <td className="text-xs text-right">{line.quantity}</td>
                                            <td className="text-xs text-right">{line.unitPrice.toFixed(0)} F</td>
                                            <td className="text-xs text-right">{(line.quantity * line.unitPrice).toFixed(0)} F</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totaux */}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between text-sm">
                                <span>Total HT</span>
                                <span className="font-medium">{totals.totalHT.toFixed(0)} FCFA</span>
                            </div>
                            {invoice.vatActive && (
                                <div className="flex justify-between text-sm">
                                    <span>TVA {invoice.vatRate}%</span>
                                    <span className="font-medium">{totals.totalVAT.toFixed(0)} FCFA</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base border-t pt-2">
                                <span>TOTAL TTC</span>
                                <span className="badge badge-accent badge-lg">{totals.totalTTC.toFixed(0)} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                        💡 Si le PDF est mal généré, essayez de zoomer moins sur la page
                    </p>
                </div>
            </div>
        </div>
    )
}

export default InvoicePDF