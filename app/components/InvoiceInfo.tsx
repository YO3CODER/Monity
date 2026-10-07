import { Invoice } from '@/type'
import React from 'react'
import BudgetSyncButton from './BudgetSyncButton'

interface Props {
    invoice: Invoice 
    setInvoice: (invoice: Invoice) => void
}

// Badge qui s'adapte au texte long (retour à la ligne, pas de débordement)
const labelClass = 'badge badge-accent h-auto max-w-full whitespace-normal break-words py-1 text-left'

const InvoiceInfo: React.FC<Props> = ({ invoice, setInvoice }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
        setInvoice({ ...invoice, [field]: e.target.value });
    };

    const handleChange = (field: string, value: string) => {
        setInvoice({ ...invoice, [field]: value });
    };

    console.log(invoice)

    return (
        <div className='flex flex-col h-fit min-w-0 bg-base-200 p-5 rounded-xl mb-4 md:mb-0'>
            <div className='space-y-4'>
                <h2 className={labelClass}>Émetteur</h2>
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

                <h2 className={labelClass}>Client</h2>
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

                <h2 className={labelClass}>Date de la Facture</h2>
                <input
                    type="date"
                    value={invoice?.invoiceDate}
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'invoiceDate')}
                />

                <h2 className={labelClass}>Date d&apos;échéance (limite de paiement)</h2>
                <input
                    type="date"
                    value={invoice?.dueDate}
                    className='input input-bordered w-full resize-none'
                    required
                    onChange={(e) => handleInputChange(e , 'dueDate')}
                />

                {/* ===== AVANCE (optionnel) ===== */}
                <h2 className={labelClass}>Avance versée</h2>
                <input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={invoice?.advanceAmount ? invoice.advanceAmount : ''}
                    placeholder="Montant en FCFA (optionnel)"
                    className='input input-bordered w-full'
                    onChange={(e) =>
                        setInvoice({
                            ...invoice,
                            advanceAmount: Math.max(0, Number(e.target.value) || 0),
                        })
                    }
                />

                <h2 className={labelClass}>Date de l&apos;avance</h2>
                <input
                    type="date"
                    value={invoice?.advanceDate || ''}
                    className='input input-bordered w-full'
                    onChange={(e) => handleInputChange(e, 'advanceDate')}
                />

                {invoice?.advanceAmount > 0 && (
                    <p className='text-xs text-gray-500 break-words'>
                        Le reste à payer est dû avant la date d&apos;échéance ci-dessus.
                    </p>
                )}

                {/* ===== ENCAISSEMENT -> BUDGET (app 2) ===== */}
                {invoice?.id && (
                    <>
                        <h2 className={labelClass}>Encaissement</h2>
                        <BudgetSyncButton invoiceId={invoice.id} />
                        <p className='text-xs text-gray-500 break-words'>
                            Enregistre d&apos;abord la facture : l&apos;envoi utilise les montants déjà sauvegardés.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

export default InvoiceInfo