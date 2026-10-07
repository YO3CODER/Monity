import React from 'react'
import { Layers } from 'lucide-react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, getView } from './shared'

const INK = '#0f0f0f'
const MUTED = '#505050'
const RED = '#dc3545'
const WM = '#e8e8e8'

const COLS =
    'grid grid-cols-[1.6rem_minmax(0,1fr)_2rem_3.6rem_4.6rem] sm:grid-cols-[2.5rem_minmax(0,1fr)_4rem_6.5rem_7.5rem]'
const CELL = 'border-l border-black px-1.5 py-2 first:border-l-0'

const RedPreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, remaining, hasAdvance } = getView(invoice, totals)

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
        <div className='w-full min-w-0 bg-white p-4 sm:p-8 text-xs' style={{ color: INK }}>
            <div className='flex items-start justify-between gap-3'>
                <h1
                    className='inline-block pb-1 pr-6 text-4xl sm:text-6xl font-extrabold uppercase leading-none sm:pr-12'
                    style={{ borderBottom: `4px solid ${INK}` }}
                >
                    Facture
                </h1>
                <div
                    className='flex h-16 w-16 shrink-0 flex-col items-center justify-center text-white sm:h-24 sm:w-24'
                    style={{ background: RED }}
                >
                    <Layers className='h-5 w-5 sm:h-7 sm:w-7' />
                    <span className='mt-1 text-[10px] sm:text-xs font-bold'>Monity</span>
                </div>
            </div>

            <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between'>
                <div className='min-w-0'>
                    <p>Facturé à :</p>
                    <p className='mt-1 text-base sm:text-lg font-bold break-words' style={{ color: RED }}>{invoice.clientName}</p>
                    <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.clientAddress}</p>
                </div>
                <div className='sm:w-52'>
                    <p>N° de facture :</p>
                    <p className='border-b border-black pb-1'>{invoice.id}</p>
                    <p className='mt-3'>Date :</p>
                    <p className='border-b border-black pb-1'>{fmtDate(invoice.invoiceDate)}</p>
                </div>
            </div>

            <div className='relative mt-6'>
                <div
                    aria-hidden
                    className='pointer-events-none absolute left-1/2 top-1/2 flex aspect-square h-3/4 max-h-72 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full'
                    style={{ background: WM }}
                >
                    <Layers className='h-1/2 w-1/2' color='#fff' strokeWidth={1.2} />
                </div>

                <div className='relative border border-black'>
                    <div className={`${COLS} text-[10px] sm:text-xs font-bold text-white`} style={{ background: RED }}>
                        <span className={`${CELL} text-center`}>No</span>
                        <span className={CELL}>Articles</span>
                        <span className={`${CELL} text-center`}>Qté</span>
                        <span className={`${CELL} text-center`}>Prix</span>
                        <span className={`${CELL} text-center`}>Total</span>
                    </div>

                    {lines.length === 0 && (
                        <p className='border-t border-black py-4 text-center' style={{ color: MUTED }}>
                            Aucune ligne de facture
                        </p>
                    )}

                    {lines.map((l, i) => (
                        <div key={i} className={`${COLS} border-t border-black`}>
                            <span className={`${CELL} text-center`}>{i + 1}</span>
                            <span className={`${CELL} break-words`}>{l.description}</span>
                            <span className={`${CELL} text-center`}>{l.quantity}</span>
                            <span className={`${CELL} text-center`}><Amount value={l.unitPrice} /></span>
                            <span className={`${CELL} text-right`}><Amount value={l.quantity * l.unitPrice} /></span>
                        </div>
                    ))}
                </div>

                <div className='relative ml-auto w-full sm:w-3/5'>
                    {rows.map((r) => (
                        <div key={r.label} className='flex justify-between gap-3 border-b border-black px-2 py-2'>
                            <span>{r.label}</span>
                            <span className='whitespace-nowrap'>{r.value}</span>
                        </div>
                    ))}
                    <div className='flex justify-between gap-3 px-2 py-2.5 font-bold text-white' style={{ background: RED }}>
                        <span>{hasAdvance ? 'Reste à payer :' : 'Total TTC :'}</span>
                        <span className='whitespace-nowrap'>
                            <Amount value={hasAdvance ? remaining : totals.totalTTC} />
                        </span>
                    </div>
                </div>
            </div>

            <div className='mt-10 flex flex-col gap-4 sm:flex-row sm:justify-between'>
                <div>
                    <p className='font-bold' style={{ color: RED }}>Informations de paiement :</p>
                    <div className='mt-2 space-y-0.5'>
                        <p><b className='inline-block w-24'>Échéance</b>: {fmtDate(invoice.dueDate)}</p>
                        {hasAdvance && <p><b className='inline-block w-24'>Avance</b>: <Amount value={advance} /></p>}
                        {hasAdvance && invoice.advanceDate && (
                            <p><b className='inline-block w-24'>Date avance</b>: {fmtDate(invoice.advanceDate)}</p>
                        )}
                    </div>
                </div>
                <div className='min-w-0 sm:text-right'>
                    <p className='font-bold break-words'>{invoice.issuerName}</p>
                    <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.issuerAddress}</p>
                </div>
            </div>
        </div>
    )
}

export default RedPreview