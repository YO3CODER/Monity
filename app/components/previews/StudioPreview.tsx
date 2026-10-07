import React from 'react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, getView } from './shared'

const PAPER = '#fffbf6'
const BOX = '#f3ede5'
const INK = '#0f0f0f'
const MUTED = '#5a5a5a'
const LIME = '#eeff3c'

const COLS =
    'grid grid-cols-[minmax(0,1fr)_2.2rem_3.6rem_4.6rem] sm:grid-cols-[minmax(0,1fr)_3.5rem_6.5rem_7.5rem] gap-x-2 items-center'

const frame = 'rounded-2xl border border-black'

const StudioPreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, hasAdvance, due } = getView(invoice, totals)
    const dueLabel = hasAdvance ? 'Reste à payer' : 'Total à payer'

    const sums: { label: string; value: React.ReactNode }[] = [
        { label: 'Sous-total (HT)', value: <Amount value={totals.totalHT} /> },
    ]
    if (invoice.vatActive) {
        sums.push({ label: `TVA (${invoice.vatRate} %)`, value: <Amount value={totals.totalVAT} /> })
    }
    sums.push({ label: 'Total TTC', value: <Amount value={totals.totalTTC} /> })
    if (hasAdvance) {
        sums.push({
            label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
            value: <Amount value={advance} prefix='- ' />,
        })
    }

    return (
        <div className='w-full min-w-0 p-4 sm:p-8 text-xs' style={{ background: PAPER, color: INK }}>
            <div className={`${frame} flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between`} style={{ background: BOX }}>
                <div>
                    <h1 className='text-3xl sm:text-5xl font-extrabold leading-none'>FACTURE</h1>
                    <p className='mt-2 text-[11px]' style={{ color: MUTED }}>Échéance : {fmtDate(invoice.dueDate)}</p>
                </div>
                <div className='min-w-0 sm:text-right'>
                    <p className='text-sm sm:text-base font-bold break-words'>{invoice.issuerName}</p>
                    <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.issuerAddress}</p>
                </div>
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center'>
                <div className='min-w-0'>
                    <p className='font-bold'>Facturé à</p>
                    <p className='mt-1 text-sm sm:text-base font-bold break-words'>{invoice.clientName}</p>
                    <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{invoice.clientAddress}</p>
                </div>
                <div>
                    <p className='font-bold'>N° de facture</p>
                    <p className='mt-1 text-base sm:text-lg font-bold'>{invoice.id}</p>
                    <p style={{ color: MUTED }}>{fmtDate(invoice.invoiceDate)}</p>
                </div>
                <div className={`${frame} px-4 py-3 sm:min-w-[12rem] sm:text-right`} style={{ background: LIME }}>
                    <p className='text-[11px]'>{dueLabel}</p>
                    <p className='text-lg sm:text-xl font-extrabold'><Amount value={due} /></p>
                </div>
            </div>

            <div className={`${frame} ${COLS} mt-5 px-4 py-2 text-[11px] font-bold`} style={{ background: LIME }}>
                <span>Article</span>
                <span className='text-right'>Qté</span>
                <span className='text-right'>Prix</span>
                <span className='text-right'>Total</span>
            </div>

            <div className='mt-3 space-y-3 rounded-3xl border border-black p-4' style={{ background: BOX }}>
                {lines.length === 0 && (
                    <p className='py-2 text-center' style={{ color: MUTED }}>Aucune ligne de facture</p>
                )}
                {lines.map((l, i) => (
                    <div key={i} className={COLS}>
                        <span className='break-words'>{l.description}</span>
                        <span className='text-right'>{l.quantity}</span>
                        <span className='text-right'><Amount value={l.unitPrice} /></span>
                        <span className='text-right'><Amount value={l.quantity * l.unitPrice} /></span>
                    </div>
                ))}
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-[1fr_17rem]'>
                <div className={`${frame} p-4`} style={{ background: BOX }}>
                    <p className='font-bold'>Informations de paiement</p>
                    <div className='mt-2 space-y-1' style={{ color: MUTED }}>
                        <p className='flex justify-between gap-3'>
                            <span>Date d&apos;échéance</span>
                            <b style={{ color: INK }}>{fmtDate(invoice.dueDate)}</b>
                        </p>
                        {hasAdvance && (
                            <p className='flex justify-between gap-3'>
                                <span>Avance reçue</span>
                                <b style={{ color: INK }}><Amount value={advance} /></b>
                            </p>
                        )}
                        {hasAdvance && invoice.advanceDate && (
                            <p className='flex justify-between gap-3'>
                                <span>Date de l&apos;avance</span>
                                <b style={{ color: INK }}>{fmtDate(invoice.advanceDate)}</b>
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <div className={`${frame} space-y-2 p-4`} style={{ background: BOX }}>
                        {sums.map((s) => (
                            <p key={s.label} className='flex justify-between gap-3'>
                                <b>{s.label}</b>
                                <span className='whitespace-nowrap'>{s.value}</span>
                            </p>
                        ))}
                    </div>
                    <div className={`${frame} mt-3 flex justify-between gap-3 px-4 py-2.5 font-bold`} style={{ background: LIME }}>
                        <span>{hasAdvance ? 'Reste à payer' : 'Total'}</span>
                        <span className='whitespace-nowrap'><Amount value={due} /></span>
                    </div>
                </div>
            </div>

            <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                    <p className='text-sm font-bold'>Merci de votre confiance</p>
                    <p style={{ color: MUTED }}>{invoice.issuerName}</p>
                </div>
                {invoice.dueDate && (
                    <div className='sm:text-right'>
                        <p className='font-bold'>Conditions</p>
                        <p style={{ color: MUTED }}>Paiement à effectuer avant le {fmtDate(invoice.dueDate)}.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudioPreview