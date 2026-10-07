import React from 'react'
import { Layers } from 'lucide-react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, QtyHead, getView } from './shared'

const PAPER = '#fcfff0'
const INK = '#032828'
const MUTED = '#465f5a'
const LIME = '#d6f264'
const RING = '#e2f0a0'

const COLS =
    'grid grid-cols-[minmax(0,1fr)_4rem_2.2rem_4.4rem] sm:grid-cols-[minmax(0,1fr)_6.5rem_5rem_7rem] gap-x-2 items-center'

const GreenPreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, hasAdvance } = getView(invoice, totals)

    type Row = { label: string; value: React.ReactNode; bold?: boolean; pill?: boolean }
    const rows: Row[] = [{ label: 'Sous-total', value: <Amount value={totals.totalHT} /> }]
    if (invoice.vatActive) {
        rows.push({ label: `TVA (${invoice.vatRate} %)`, value: <Amount value={totals.totalVAT} /> })
    }
    rows.push({
        label: hasAdvance ? 'Total TTC' : 'Total',
        value: <Amount value={totals.totalTTC} />,
        bold: true,
        pill: !hasAdvance,
    })
    if (hasAdvance) {
        rows.push({
            label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
            value: <Amount value={advance} prefix='- ' />,
        })
        rows.push({ label: 'Reste à payer', value: <Amount value={totals.totalTTC - advance} />, bold: true, pill: true })
    }

    return (
        <div className='relative w-full min-w-0 overflow-hidden p-4 sm:p-8 text-xs' style={{ background: PAPER, color: INK }}>
            <div
                aria-hidden
                className='pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full'
                style={{ backgroundImage: `repeating-radial-gradient(circle, transparent 0 5px, ${RING} 5px 6px)` }}
            />

            <div className='relative'>
                <div className='flex items-center justify-between gap-3'>
                    <span className='min-w-0 truncate text-[10px] font-bold uppercase'>{invoice.issuerName}</span>
                    <span className='flex shrink-0 items-center justify-center rounded-full p-2' style={{ background: INK }}>
                        <Layers className='h-5 w-5' color={LIME} />
                    </span>
                </div>

                <h1 className='relative mt-4 inline-block text-6xl sm:text-8xl font-extrabold leading-none'>
                    <span
                        className='absolute -top-1 left-6 sm:left-10 z-0 h-5 w-5 sm:h-8 sm:w-8 rounded-full'
                        style={{ background: LIME }}
                    />
                    <span className='relative z-10'>Facture</span>
                </h1>

                <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between'>
                    <div>
                        <p style={{ color: MUTED }}>{fmtDate(invoice.invoiceDate)}</p>
                        <p className='mt-1 text-sm font-bold'>FACTURE N° {invoice.id}</p>
                    </div>
                    <div className='min-w-0 sm:max-w-[55%] sm:text-right'>
                        <p className='text-sm font-bold'>FACTURÉ À :</p>
                        <p className='font-bold break-words'>{invoice.clientName}</p>
                        <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.clientAddress}</p>
                    </div>
                </div>

                <div className={`${COLS} mt-6 rounded-full px-4 py-2 text-[10px] sm:text-xs font-bold`} style={{ background: LIME }}>
                    <span>DESCRIPTION</span>
                    <span className='text-center'>PRIX</span>
                    <span className='text-center'><QtyHead /></span>
                    <span className='text-right'>TOTAL</span>
                </div>

                <div className='mt-2'>
                    {lines.length === 0 && (
                        <p className='py-4 text-center' style={{ color: MUTED }}>Aucune ligne de facture</p>
                    )}
                    {lines.map((l, i) => (
                        <div key={i} className={`${COLS} px-4 py-2.5`}>
                            <span className='break-words'>{l.description}</span>
                            <span className='text-center'><Amount value={l.unitPrice} /></span>
                            <span className='text-center'>{l.quantity}</span>
                            <span className='text-right'><Amount value={l.quantity * l.unitPrice} /></span>
                        </div>
                    ))}
                </div>

                <div className='mt-4 ml-auto w-full space-y-1.5 sm:w-80'>
                    {rows.map((r) => (
                        <div
                            key={r.label}
                            className={`flex justify-between gap-3 ${r.pill ? 'rounded-full px-4 py-1.5' : 'px-1'} ${r.bold ? 'font-bold' : ''}`}
                            style={r.pill ? { background: LIME } : undefined}
                        >
                            <span>{r.label}</span>
                            <span className='whitespace-nowrap'>{r.value}</span>
                        </div>
                    ))}
                </div>

                <div className='mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between'>
                    <div>
                        <p className='text-4xl sm:text-5xl font-extrabold'>Merci !</p>
                        <p className='mt-4 text-[10px] font-bold'>INFORMATIONS DE PAIEMENT</p>
                        <div className='mt-1' style={{ color: MUTED }}>
                            <p>Échéance : {fmtDate(invoice.dueDate)}</p>
                            {hasAdvance && <p>Avance reçue : <Amount value={advance} /></p>}
                            {hasAdvance && invoice.advanceDate && <p>Date de l&apos;avance : {fmtDate(invoice.advanceDate)}</p>}
                        </div>
                    </div>
                    <div className='min-w-0 sm:text-right'>
                        <p className='text-[10px] font-bold uppercase'>{invoice.issuerName}</p>
                        <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.issuerAddress}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GreenPreview