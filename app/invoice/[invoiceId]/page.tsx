// app/components/InvoicePDF.tsx
"use client"

import { Invoice, Totals } from '@/type'
import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine } from 'lucide-react'

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {
    const factureRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownloadPdf = async () => {
        if (!factureRef.current) return
        
        try {
            setIsGenerating(true)
            const canvas = await html2canvas(factureRef.current, { scale: 2 })
            const imgData = canvas.toDataURL('image/png')
            
            const pdf = new jsPDF()
            pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
            pdf.save(`facture-${invoice.id}.pdf`)
        } catch (error) {
            console.error('Erreur:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="w-full mt-4">
            {/* Bouton toujours visible */}
            <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="btn btn-accent w-full mb-4"
            >
                {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                <ArrowDownFromLine className="w-4 ml-2" />
            </button>

            {/* Facture toujours visible */}
            <div 
                ref={factureRef}
                className="bg-white p-6 border rounded-lg"
            >
                <h1 className="text-2xl font-bold mb-4">FACTURE #{invoice.id}</h1>
                
                <div className="mb-4">
                    <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                    <p><strong>Échéance:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="font-bold">Émetteur:</p>
                        <p>{invoice.issuerName}</p>
                        <p className="text-sm">{invoice.issuerAddress}</p>
                    </div>
                    <div>
                        <p className="font-bold">Client:</p>
                        <p>{invoice.clientName}</p>
                        <p className="text-sm">{invoice.clientAddress}</p>
                    </div>
                </div>

                <table className="w-full border-collapse mb-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Description</th>
                            <th className="p-2 text-right">Qté</th>
                            <th className="p-2 text-right">Prix</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.lines.map((line, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-2">{line.description}</td>
                                <td className="p-2 text-right">{line.quantity}</td>
                                <td className="p-2 text-right">{line.unitPrice}</td>
                                <td className="p-2 text-right">{line.quantity * line.unitPrice}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="text-right">
                    <p><strong>Total HT:</strong> {totals.totalHT} FCFA</p>
                    {invoice.vatActive && (
                        <p><strong>TVA {invoice.vatRate}%:</strong> {totals.totalVAT} FCFA</p>
                    )}
                    <p className="text-xl font-bold mt-2">Total TTC: {totals.totalTTC} FCFA</p>
                </div>
            </div>
        </div>
    )
}

export default InvoicePDF