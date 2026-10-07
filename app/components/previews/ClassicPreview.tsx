import React from 'react'
import { Layers } from 'lucide-react'
import { fmtDate } from '@/lib/pdfTemplates/shared'
import { Amount, PreviewProps, getView } from './shared'

const INK = '#1f1435'
const MUTED = '#6e697d'
const BAND = '#f7f8fa'
const BADGE = '#ece7e5'
const ACCENT = '#eeaf3a'
const AMBER = '#ffc107'
const LINE = '#e1e1e8'

const GRID =
    'grid grid-cols-[1.5rem_minmax(0,1fr)_2rem_3.6rem_4.6rem] sm:grid-cols-[2rem_minmax(0,1fr)_3.5rem_6.5rem_7.5rem] gap-x-2 items-center'

const ClassicPreview: React.FC<PreviewProps> = ({ invoice, totals }) => {
    const { lines, advance, remaining, hasAdvance } = getView(invoice, totals)

    return (
        <div className='w-full min-w-0 bg-white p-4 sm:p-8 text-xs sm:text-sm' style={{ color: INK }}>
            <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <div className='flex items-center'>
                        <span className='flex items-center justify-center rounded-full p-2' style={{ background: INK }}>
                            <Layers className='h-5 w-5' color={ACCENT} />
                        </span>
                        <span className='ml-2 font-bold italic text-xl sm:text-2xl'>
                            Mon<span style={{ color: ACCENT }}>ity</span>
                        </span>
                    </div>
                    <h1 className='mt-1 text-3xl sm:text-5xl font-bold uppercase'>Facture</h1>
                </div>
                <span className='shrink-0 rounded-full px-3 py-1 text-xs' style={{ background: BADGE }}>
                    N° {invoice.id}
                </span>
            </div>

            <div
                className='mt-4 flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-lg p-2.5 sm:p-3'
                style={{ background: BAND }}
            >
                <p><span className='font-bold'>Date :</span> {fmtDate(invoice.invoiceDate)}</p>
                <p><span className='font-bold'>Échéance :</span> {fmtDate(invoice.dueDate)}</p>
            </div>

            <div className='mt-3 space-y-3'>
                {[
                    { label: 'Émetteur', name: invoice.issuerName, address: invoice.issuerAddress },
                    { label: 'Client', name: invoice.clientName, address: invoice.clientAddress },
                ].map((p) => (
                    <div key={p.label} className='min-w-0 rounded-lg p-3' style={{ background: BAND }}>
                        <span className='inline-block rounded-full px-2 py-0.5 text-[10px] sm:text-xs' style={{ background: BADGE }}>
                            {p.label}
                        </span>
                        <p className='mt-1 font-bold italic break-words'>{p.name}</p>
                        <p className='break-words whitespace-pre-line' style={{ color: MUTED }}>{p.address}</p>
                    </div>
                ))}
            </div>

            <div className='mt-5'>
                <div className={`${GRID} border-b pb-2 text-[10px] sm:text-xs font-bold`} style={{ color: MUTED, borderColor: LINE }}>
                    <span>#</span>
                    <span>Description</span>
                    <span className='text-right'>Qté</span>
                    <span className='text-right'>P.U</span>
                    <span className='text-right'>Total</span>
                </div>

                {lines.length === 0 && (
                    <p className='py-4 text-center' style={{ color: MUTED }}>Aucune ligne de facture</p>
                )}

                {lines.map((l, i) => (
                    <div key={i} className={`${GRID} border-b py-2.5`} style={{ borderColor: LINE }}>
                        <span>{i + 1}</span>
                        <span className='break-words'>{l.description}</span>
                        <span className='text-right'>{l.quantity}</span>
                        <span className='text-right'><Amount value={l.unitPrice} /></span>
                        <span className='text-right font-bold'><Amount value={l.quantity * l.unitPrice} /></span>
                    </div>
                ))}
            </div>

            <div className='mt-4 space-y-2'>
                <div className='flex justify-between gap-3'>
                    <span>Total HT</span>
                    <span className='font-bold'><Amount value={totals.totalHT} /></span>
                </div>

                {invoice.vatActive && (
                    <div className='flex justify-between gap-3'>
                        <span>TVA {invoice.vatRate} %</span>
                        <span className='font-bold'><Amount value={totals.totalVAT} /></span>
                    </div>
                )}

                <div className='flex items-center justify-between gap-3 border-t pt-2' style={{ borderColor: LINE }}>
                    <span className='font-bold text-sm sm:text-base'>Total TTC</span>
                    <span className='rounded-full px-3 py-0.5 font-bold' style={{ background: ACCENT }}>
                        <Amount value={totals.totalTTC} />
                    </span>
                </div>

                {hasAdvance && (
                    <>
                        <div className='flex justify-between gap-3'>
                            <span className='min-w-0 break-words'>
                                Avance{invoice.advanceDate ? ` (${fmtDate(invoice.advanceDate)})` : ''}
                            </span>
                            <span className='font-bold whitespace-nowrap'><Amount value={advance} prefix='- ' /></span>
                        </div>

                        <div className='flex items-center justify-between gap-3 border-t pt-2' style={{ borderColor: LINE }}>
                            <span className='font-bold text-sm sm:text-base'>Reste à payer</span>
                            <span className='rounded-full px-3 py-0.5 font-bold' style={{ background: AMBER }}>
                                <Amount value={remaining} />
                            </span>
                        </div>

                        {invoice.dueDate && (
                            <div className='flex justify-between gap-3' style={{ color: MUTED }}>
                                <span>Reste à payer avant le</span>
                                <span className='whitespace-nowrap'>{fmtDate(invoice.dueDate)}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ClassicPreview