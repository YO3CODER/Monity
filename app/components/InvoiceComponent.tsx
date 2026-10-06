import { Invoice } from '@/type'
import { computeBalance } from '@/lib/balance' // AVANCE
import { CheckCircle, Clock, FileText, SquareArrowOutUpRight, XCircle } from 'lucide-react';
import Link from 'next/link'; 
import React from 'react'

type InvoiceComponentProps = {
    invoice: Invoice;
    index?: number;
}

// Badge qui ne se coupe jamais : texte sur une ligne, hauteur automatique
const badgeBase = 'badge badge-lg h-auto py-1 flex items-center gap-2 whitespace-nowrap'

const getStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return (
                <div className={badgeBase}>
                    <FileText className='w-4 shrink-0' />
                    Brouillon
                </div>
            )
        case 2:
            return (
                <div className={`${badgeBase} badge-warning`}>
                    <Clock className='w-4 shrink-0' />
                    En attente
                </div>
            )
        case 3:
            return (
                <div className={`${badgeBase} badge-success`}>
                    <CheckCircle className='w-4 shrink-0' />
                    Payée
                </div>
            )
        case 4:
            return (
                <div className={`${badgeBase} badge-info`}>
                    <XCircle className='w-4 shrink-0' />
                    Annulée
                </div>
            )
        case 5:
            return (
                <div className={`${badgeBase} badge-error`}>
                    <XCircle className='w-4 shrink-0' />
                    Impayée
                </div>
            )
        default:
            return (
                <div className={badgeBase}>
                    <XCircle className='w-4 shrink-0' />
                    Indéfini
                </div>
            )
    }
}

const InvoiceComponent: React.FC<InvoiceComponentProps> = ({ invoice }) => {

    const calculateTotals = () => {
        const totalHT = invoice?.lines?.reduce((acc, line) => {
            const quantity = line.quantity ?? 0;
            const unitPrice = line.unitPrice ?? 0;
            return acc + quantity * unitPrice
        }, 0) || 0

        const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
        const totalTTC = totalHT + totalVAT
        
        return { totalHT, totalVAT, totalTTC }
    }

    const { totalHT, totalVAT, totalTTC } = calculateTotals()

    // AVANCE : avance retenue et reste à payer
    const { advance, remaining } = computeBalance(totalTTC, invoice.advanceAmount)

    return (
        <div className='bg-base-200/90 p-5 rounded-xl space-y-3 shadow min-w-0'>
            <div className='flex justify-between items-center w-full gap-2'>
                <div className='min-w-0'>{getStatusBadge(invoice.status)}</div>
                <Link
                    className='btn btn-accent btn-sm shrink-0 whitespace-nowrap'
                    href={`/invoice/${invoice.id}`}>
                    Plus
                    <SquareArrowOutUpRight className='w-4' />
                </Link>
            </div>

            <div className='w-full'>
                <div>
                    <div className='stat-title'>
                        <div className='uppercase text-sm break-words'>FACT-{invoice.id}</div>
                    </div>
                    
                    {/* Total HT */}
                    <div className='flex justify-between items-center gap-2 text-sm text-gray-600'>
                        <span className='whitespace-nowrap'>Montant HT :</span>
                        <span className='font-medium whitespace-nowrap'>{totalHT.toFixed(0)} FCFA</span>
                    </div>
                    
                    {/* TVA (si active) */}
                    {invoice.vatActive && (
                        <div className='flex justify-between items-center gap-2 text-sm text-gray-600'>
                            <span className='whitespace-nowrap'>TVA ({invoice.vatRate}%) :</span>
                            <span className='font-medium whitespace-nowrap'>{totalVAT.toFixed(0)} FCFA</span>
                        </div>
                    )}
                    
                    {/* Total TTC (mis en évidence) */}
                    <div className='flex justify-between items-center gap-2 mt-2 pt-2 border-t border-base-300'>
                        <span className='font-bold whitespace-nowrap'>Total TTC :</span>
                        <span className='stat-value text-xl text-accent whitespace-nowrap'>
                            {totalTTC.toFixed(0)} FCFA
                        </span>
                    </div>

                    {/* AVANCE : affichée seulement s'il y a une avance */}
                    {advance > 0 && (
                        <div className='mt-2 space-y-1 text-sm'>
                            <div className='flex justify-between items-center gap-2 text-gray-600'>
                                <span className='whitespace-nowrap'>Avance versée :</span>
                                <span className='font-medium whitespace-nowrap'>- {advance.toFixed(0)} FCFA</span>
                            </div>
                            <div className='flex justify-between items-center gap-2'>
                                <span className='font-bold whitespace-nowrap'>Reste à payer :</span>
                                <span className='font-bold text-error whitespace-nowrap'>
                                    {remaining.toFixed(0)} FCFA
                                </span>
                            </div>
                        </div>
                    )}
                    
                    <div className='stat-desc mt-2 whitespace-normal break-words'>
                        {invoice.name}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvoiceComponent