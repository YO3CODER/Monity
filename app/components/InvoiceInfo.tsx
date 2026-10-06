import { Invoice } from '@/type'
import { DEFAULT_ADVANCE_DELAY_DAYS, addDays } from '@/lib/balance' // AVANCE
import React from 'react'

interface Props {
    invoice: Invoice 
    setInvoice: (invoice: Invoice) => void
}

const InvoiceInfo: React.FC<Props> = ({ invoice, setInvoice }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
        setInvoice({ ...invoice, [field]: e.target.value });
    };

    const handleChange = (field: string, value: string) => {
        setInvoice({ ...invoice, [field]: value });
    };

    // AVANCE : date limite suggérée (date de facture + délai par défaut)
    const suggestedAdvanceDueDate = addDays(invoice?.invoiceDate, DEFAULT_ADVANCE_DELAY_DAYS);

    console.log(invoice)

    return (
        <div className='flex flex-col h-fit bg-base-200 p-5 rounded-xl mb-4 md:mb-0'>
            <div className='space-y-4'>
                <h2 className='badge badge-accent'>Émetteur</h2>
                <input
                    type="text"
                    value={invoice?.issuerName}
                    placeholder="Nom de l'entreprise émettrice"
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'issuerName')}
                />

                <textarea
                    rows={3}
                    className='textarea textarea-bordered w-full'
                    value={invoice?.issuerAddress}
                    onChange={(e) => handleChange('issuerAddress', e.target.value)}
                />

                <h2 className='badge badge-accent'>Client</h2>
                <input
                    type="text"
                    value={invoice?.clientName}
                    placeholder="Nom de l'entreprise cliente"
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'clientName')}
                />

                <textarea
                    value={invoice?.clientAddress}
                    placeholder="Adresse de l'entreprise cliente"
                    className='textarea textarea-bordered w-full resize-none h-40'
                    rows={5}
                    required
                    onChange={(e) => handleInputChange(e , 'clientAddress')}
                />

                <h2 className='badge badge-accent'>Date de la Facture</h2>
                <input
                    type="date"
                    value={invoice?.invoiceDate}
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'invoiceDate')}
                />

                <h2 className='badge badge-accent'>Date d&apos;échéance</h2>
                <input
                    type="date"
                    value={invoice?.dueDate}
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'dueDate')}
                />

                {/* ===== AVANCE (optionnel) ===== */}
                <h2 className='badge badge-accent'>Avance versée par le client (optionnel)</h2>
                <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={invoice?.advanceAmount ? invoice.advanceAmount : ''}
                    placeholder="Montant de l'avance en FCFA"
                    className='input input-bordered w-full'
                    onChange={(e) =>
                        setInvoice({
                            ...invoice,
                            advanceAmount: Math.max(0, Number(e.target.value) || 0),
                        })
                    }
                />

                <h2 className='badge badge-accent'>Date de l&apos;avance</h2>
                <input
                    type="date"
                    value={invoice?.advanceDate || ''}
                    className='input input-bordered w-full'
                    onChange={(e) => handleInputChange(e, 'advanceDate')}
                />

                <h2 className='badge badge-accent'>Date limite de paiement de l&apos;avance</h2>
                <input
                    type="date"
                    value={invoice?.advanceDueDate || ''}
                    className='input input-bordered w-full'
                    onChange={(e) => handleInputChange(e, 'advanceDueDate')}
                />
                {!invoice?.advanceDueDate && suggestedAdvanceDueDate && (
                    <p className='text-xs text-gray-500'>
                        Si vide, la date limite sera le {suggestedAdvanceDueDate} (date de facture + {DEFAULT_ADVANCE_DELAY_DAYS} jours).
                    </p>
                )}
            </div>
        </div>
    )
}

export default InvoiceInfo