import React from 'react'
import { Layers } from 'lucide-react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, getView } from './shared'

const BG = '#f6f4f0'
const RED = '#d44846'
const PINK = '#f0d0cd'
const INK = '#191919'
const MUTED = '#5a5a5a'

const COLS =
    'grid grid-cols-[minmax(0,1fr)_2rem_3.8rem_4.4rem] sm:grid-cols-[minmax(0,1fr)_4rem_7rem_7.5rem] gap-x-2 items-center'

const BannerPreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, hasAdvance, due } = getView(invoice, totals)
    const dueLabel = hasAdvance ? 'Reste à payer :' : 'Total à payer :'

    type Row = { label: string; value: React.ReactNode }
    const rows: Row[] = [{ label: 'Sous-total :', value: <Amount value={totals.totalHT} /> }]
    if (invoice.vatActive) {
        rows.push({ label: `TVA (${invoice.vatRate} %) :`, value: <Amount value={totals.totalVAT} /> })
    }
    if (hasAdvance) {
        rows.push({ label: 'Total TTC :', value: <Amount value={totals.totalTTC} /> })
        rows.push({
            label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)}) :` : 'Avance versée :',
            value: <Amount value={advance} prefix='- ' />,
        })
    }

    return (
        <div className='w-full min-w-0 overflow-hidden text-xs' style={{ background: BG, color: INK }}>
            <div className='flex items-center justify-between gap-3 px-4 py-6 text-white sm:px-8 sm:py-9' style={{ background: RED }}>
                <div className='flex min-w-0 items-center gap-3'>
                    <Layers className='h-8 w-8 shrink-0 sm:h-10 sm:w-10' strokeWidth={1.6} />
                    <div className='min-w-0'>
                        <p className='truncate text-sm sm:text-lg font-bold'>{invoice.issuerName || 'Monity'}</p>
                        <p className='text-[10px] sm:text-xs'>Monity</p>
                    </div>
                </div>
                <h1 className='text-2xl sm:text-5xl font-light tracking-wide'>FACTURE</h1>
            </div>

            <div className='p-4 sm:p-8'>
                <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
                    <div className='min-w-0'>
                        <p>Facturé à :</p>
                        <p className='mt-1 text-sm sm:text-base font-bold break-words' style={{ color: RED }}>{invoice.clientName}</p>
                        <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.clientAddress}</p>
                    </div>
                    <div className='sm:text-right'>
                        <p>N° de facture : {invoice.id}</p>
                        <p>Date : {fmtDate(invoice.invoiceDate)}</p>
                        <div className='my-2 h-0.5 w-6 sm:ml-auto' style={{ background: INK }} />
                        <p style={{ color: MUTED }}>{dueLabel}</p>
                        <p className='text-xl sm:text-2xl font-bold' style={{ color: RED }}><Amount value={due} /></p>
                    </div>
                </div>

                <div className={`${COLS} mt-6 px-3 py-2 text-[10px] sm:text-xs font-bold`} style={{ background: PINK, color: RED }}>
                    <span>DESCRIPTION</span>
                    <span className='text-center'>QTÉ</span>
                    <span className='text-center'>PRIX</span>
                    <span className='text-right'>TOTAL</span>
                </div>

                {lines.length === 0 && (
                    <p className='py-4 text-center' style={{ color: MUTED }}>Aucune ligne de facture</p>
                )}
                {lines.map((l, i) => (
                    <div key={i} className={`${COLS} border-b px-3 py-3`} style={{ borderColor: MUTED }}>
                        <span className='break-words'>{l.description}</span>
                        <span className='text-center'>{l.quantity}</span>
                        <span className='text-center'><Amount value={l.unitPrice} /></span>
                        <span className='text-right'><Amount value={l.quantity * l.unitPrice} /></span>
                    </div>
                ))}

                <div className='mt-4 ml-auto w-full sm:w-80'>
                    {rows.map((r) => (
                        <div key={r.label} className='flex justify-between gap-3 px-3 py-1.5'>
                            <span>{r.label}</span>
                            <span className='whitespace-nowrap'>{r.value}</span>
                        </div>
                    ))}
                    <div className='mt-1 flex justify-between gap-3 px-3 py-2.5 font-bold' style={{ background: PINK, color: RED }}>
                        <span>{hasAdvance ? 'RESTE À PAYER :' : 'TOTAL :'}</span>
                        <span className='whitespace-nowrap'><Amount value={due} /></span>
                    </div>
                </div>

                <div className='mt-8'>
                    <p className='text-sm font-bold'>Mode de paiement</p>
                    <div className='mt-1 space-y-0.5'>
                        <p>Échéance : {fmtDate(invoice.dueDate)}</p>
                        {hasAdvance && <p>Avance reçue : <Amount value={advance} /></p>}
                        {hasAdvance && invoice.advanceDate && <p>Date de l&apos;avance : {fmtDate(invoice.advanceDate)}</p>}
                    </div>
                </div>

                <div className='mt-5'>
                    <p className='text-sm font-bold'>Conditions</p>
                    <p className='mt-1'>
                        {invoice.dueDate
                            ? `Merci d'effectuer le paiement avant le ${fmtDate(invoice.dueDate)}.`
                            : 'Merci de votre confiance.'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default BannerPreview