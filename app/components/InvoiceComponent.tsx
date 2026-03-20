import { Invoice } from '@/type'
import { CheckCircle, Clock, FileText, SquareArrowOutUpRight, XCircle } from 'lucide-react';
import Link from 'next/link';
import React from 'react'

type InvoiceComponentProps = {
    invoice: Invoice;
    index?: number;
}

const getStatusBadge = (status: number) => {
    switch (status) {
        case 1:
            return (
                <div className='badge badge-lg flex items-center gap-2'>
                    <FileText className='w-4' />
                    Brouillon
                </div>
            )
        case 2:
            return (
                <div className='badge badge-lg badge-warning flex items-center gap-2'>
                    <Clock className='w-4' />
                    En attente
                </div>
            )
        case 3:
            return (
                <div className='badge badge-lg badge-success flex items-center gap-2'>
                    <CheckCircle className='w-4' />
                    Payée
                </div>
            )
        case 4:
            return (
                <div className='badge badge-lg badge-info flex items-center gap-2'>
                    <XCircle className='w-4' />
                    Annulée
                </div>
            )
        case 5:
            return (
                <div className='badge badge-lg badge-error flex items-center gap-2'>
                    <XCircle className='w-4' />
                    Impayée
                </div>
            )
        default:
            return (
                <div className='badge badge-lg'>
                    <XCircle className='w-4' />
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

    return (
        <div className='bg-base-200/90 p-5 rounded-xl space-y-3 shadow'>
            <div className='flex justify-between items-center w-full'>
                <div>{getStatusBadge(invoice.status)}</div>
                <Link
                    className='btn btn-accent btn-sm'
                    href={`/invoice/${invoice.id}`}>
                    Plus
                    <SquareArrowOutUpRight className='w-4' />
                </Link>
            </div>

            <div className='w-full'>
                <div>
                    <div className='stat-title'>
                        <div className='uppercase text-sm'>FACT-{invoice.id}</div>
                    </div>
                    
                    {/* Total HT */}
                    <div className='flex justify-between items-center text-sm text-gray-600'>
                        <span>Montant HT :</span>
                        <span className='font-medium'>{totalHT.toFixed(0)} FCFA</span>
                    </div>
                    
                    {/* TVA (si active) */}
                    {invoice.vatActive && (
                        <div className='flex justify-between items-center text-sm text-gray-600'>
                            <span>TVA ({invoice.vatRate}%) :</span>
                            <span className='font-medium'>{totalVAT.toFixed(0)} FCFA</span>
                        </div>
                    )}
                    
                    {/* Total TTC (mis en évidence) */}
                    <div className='flex justify-between items-center mt-2 pt-2 border-t border-base-300'>
                        <span className='font-bold'>Total TTC :</span>
                        <span className='stat-value text-2xl text-accent'>
                            {totalTTC.toFixed(0)} FCFA
                        </span>
                    </div>
                    
                    <div className='stat-desc mt-2'>
                        {invoice.name}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvoiceComponent