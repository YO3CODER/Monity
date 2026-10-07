import React from 'react'
import { Check, Layers } from 'lucide-react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, QtyHead, getView } from './shared'

const CREAM = '#fffff2'
const INK = '#141414'
const GRAY = '#5f5f5f'
const YELLOW = '#ffe628'
const LIME = '#e4ff50'
const PINK = '#ffb8f0'
const AMBER = '#ffc107'
const ACCENT = '#eeaf3a'
const SEP = '#cdcdc3'

const COLS =
    'grid grid-cols-[minmax(0,1fr)_4.4rem_2.4rem_4.4rem] sm:grid-cols-[minmax(0,1.6fr)_1fr_0.8fr_1fr] gap-1.5 items-center'

const CreativePreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, remaining, hasAdvance, due } = getView(invoice, totals)
    const dueLabel = hasAdvance ? 'Reste à payer' : 'Total à payer'

    const rows: { label: string; value: React.ReactNode; strong?: boolean }[] = [
        { label: 'Sous-total (HT)', value: <Amount value={totals.totalHT} /> },
    ]
    if (invoice.vatActive) {
        rows.push({ label: `TVA (${invoice.vatRate} %)`, value: <Amount value={totals.totalVAT} /> })
    }
    rows.push({ label: 'Total TTC', value: <Amount value={totals.totalTTC} />, strong: !hasAdvance })
    if (hasAdvance) {
        rows.push({
            label: invoice.advanceDate ? `Avance (${fmtDate(invoice.advanceDate)})` : 'Avance versée',
            value: <Amount value={advance} prefix='- ' />,
        })
        rows.push({ label: 'Reste à payer', value: <Amount value={remaining} />, strong: true })
    }

    return (
        <div className='w-full min-w-0 overflow-hidden p-4 sm:p-8 text-xs' style={{ background: CREAM, color: INK }}>
            <div className='flex items-center'>
                <span className='flex items-center justify-center rounded-full p-2' style={{ background: INK }}>
                    <Layers className='h-5 w-5' color={ACCENT} />
                </span>
                <span className='ml-2 font-bold italic text-lg sm:text-xl'>
                    Mon<span style={{ color: ACCENT }}>ity</span>
                </span>
            </div>

            <h1 className='relative mt-4 inline-block text-5xl sm:text-7xl font-extrabold leading-none'>
                <span
                    className='absolute -left-2 -right-2 bottom-0.5 z-0 h-4 sm:h-7 rounded-sm'
                    style={{ background: LIME, transform: 'rotate(-1deg)' }}
                />
                <span className='relative z-10'>Facture</span>
            </h1>

            <div className='mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1 border-b pb-2' style={{ borderColor: INK }}>
                <span><span style={{ color: GRAY }}>N° de facture : </span><b>{invoice.id}</b></span>
                <span><span style={{ color: GRAY }}>Date : </span><b>{fmtDate(invoice.invoiceDate)}</b></span>
                <span><span style={{ color: GRAY }}>Échéance : </span><b>{fmtDate(invoice.dueDate)}</b></span>
            </div>

            <div
                className='-mx-4 sm:-mx-8 mt-4 grid gap-4 border-b px-4 py-4 sm:grid-cols-2 sm:px-8'
                style={{ background: YELLOW, borderColor: INK }}
            >
                <div className='min-w-0'>
                    <p className='text-[10px] font-bold'>ÉMETTEUR</p>
                    <p className='mt-1 text-sm sm:text-base font-bold break-words'>{invoice.issuerName}</p>
                    <p className='break-words whitespace-pre-line'>{invoice.issuerAddress}</p>
                </div>
                <div className='min-w-0 sm:text-right'>
                    <p className='text-[10px] font-bold'>CLIENT</p>
                    <p className='mt-1 text-sm sm:text-base font-bold break-words'>{invoice.clientName}</p>
                    <p className='break-words whitespace-pre-line'>{invoice.clientAddress}</p>
                </div>
            </div>

            <div className={`${COLS} mt-6`}>
                {['DESCRIPTION', 'PRIX', 'QTY', 'TOTAL'].map((h) => (
                    <span
                        key={h}
                        className='rounded-md border px-1 py-1 text-center text-[10px] font-bold'
                        style={{ background: PINK, borderColor: INK }}
                    >
                        {h === 'QTY' ? <QtyHead /> : h}
                    </span>
                ))}
            </div>

            <div className='mt-2 rounded-xl border' style={{ borderColor: INK }}>
                {lines.length === 0 && (
                    <p className='py-4 text-center' style={{ color: GRAY }}>Aucune ligne de facture</p>
                )}
                {lines.map((l, i) => (
                    <div
                        key={i}
                        className={`${COLS} px-3 py-2.5`}
                        style={i > 0 ? { borderTop: `1px solid ${SEP}` } : undefined}
                    >
                        <span className='break-words'>{l.description}</span>
                        <span className='text-center'><Amount value={l.unitPrice} /></span>
                        <span className='text-center'>{l.quantity}</span>
                        <span className='text-right font-bold'><Amount value={l.quantity * l.unitPrice} /></span>
                    </div>
                ))}
            </div>

            <div className='mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                    <p className='text-sm font-bold'>{dueLabel}</p>
                    <div className='mt-1 flex items-center'>
                        <span className='text-2xl sm:text-3xl font-extrabold'><Amount value={due} /></span>
                        <span
                            className='ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full'
                            style={{ background: AMBER }}
                        >
                            <Check className='h-4 w-4' color='#fff' strokeWidth={3} />
                        </span>
                    </div>
                    {invoice.dueDate && (
                        <p className='mt-2 border-t pt-2' style={{ borderColor: INK, color: GRAY }}>
                            À payer avant le {fmtDate(invoice.dueDate)}
                        </p>
                    )}
                </div>

                <div
                    className='w-full space-y-1.5 rounded-xl border p-3 sm:w-72'
                    style={{ background: LIME, borderColor: INK }}
                >
                    {rows.map((r) => (
                        <div key={r.label} className={`flex justify-between gap-3 ${r.strong ? 'font-bold text-sm' : ''}`}>
                            <span className='font-bold'>{r.label}</span>
                            <span className='whitespace-nowrap'>{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                    <p className='text-sm font-bold'>Informations de paiement</p>
                    <p className='mt-1' style={{ color: GRAY }}>Date d&apos;échéance : <b style={{ color: INK }}>{fmtDate(invoice.dueDate)}</b></p>
                    {hasAdvance && (
                        <p style={{ color: GRAY }}>Avance reçue : <b style={{ color: INK }}><Amount value={advance} /></b></p>
                    )}
                    {hasAdvance && invoice.advanceDate && (
                        <p style={{ color: GRAY }}>Date de l&apos;avance : <b style={{ color: INK }}>{fmtDate(invoice.advanceDate)}</b></p>
                    )}
                </div>
                <div className='sm:text-right'>
                    <p className='text-base sm:text-lg font-extrabold'>MERCI DE VOTRE CONFIANCE</p>
                    <p className='font-bold'>{invoice.issuerName}</p>
                </div>
            </div>
        </div>
    )
}

export default CreativePreview