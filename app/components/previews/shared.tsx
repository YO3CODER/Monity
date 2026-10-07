import React from 'react'
import { Invoice, Totals } from '@/type'
import { computeBalance } from '@/lib/balance'
import { money } from '@/lib/pdfTemplates/shared'

export interface PreviewProps {
    invoice: Invoice
    totals: Totals
}

export type Line = { description: string; quantity: number; unitPrice: number }

// Montant : version courte (sans FCFA) sur petit écran, complète à partir de sm
export const Amount: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '' }) => (
    <>
        <span className='sm:hidden'>{prefix}{money(value).replace(/ FCFA$/, '')}</span>
        <span className='hidden sm:inline'>{prefix}{money(value)}</span>
    </>
)

// Libellé « Quantité » abrégé sur petit écran
export const QtyHead: React.FC = () => (
    <>
        <span className='sm:hidden'>QTÉ</span>
        <span className='hidden sm:inline'>QUANTITÉ</span>
    </>
)

export function getView(invoice: Invoice, totals: Totals) {
    const { advance, remaining } = computeBalance(totals.totalTTC, invoice.advanceAmount)
    const hasAdvance = advance > 0
    const lines = (invoice.lines || []) as Line[]
    const due = hasAdvance ? remaining : totals.totalTTC
    return { lines, advance, remaining, hasAdvance, due }
}