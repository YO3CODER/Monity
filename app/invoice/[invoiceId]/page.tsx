"use client"
import { deleteInvoice, getInvoiceById, updateInvoice } from '@/app/actions'
import InvoiceInfo from '@/app/components/InvoiceInfo'
import InvoiceLines from '@/app/components/InvoiceLines'
import InvoicePDF from '@/app/components/InvoicePDF'
import VATControl from '@/app/components/VATControl'
import Wrapper from '@/app/components/Wrapper'
import { Invoice, Totals } from '@/type'
import { Save, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = ({ params }: { params: Promise<{ invoiceId: string }> }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null)
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  const fetchInvoice = async () => {
    try {
      const { invoiceId } = await params
      const fetchedInvoice = await getInvoiceById(invoiceId)
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice)
        setInitialInvoice(fetchedInvoice)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchInvoice()
  }, [])

  useEffect(() => {
    if (!invoice) return;
    const ht = invoice.lines.reduce((acc, { quantity, unitPrice }) =>
      acc + quantity * unitPrice, 0
    )
    const vat = invoice.vatActive ? ht * (invoice.vatRate / 100) : 0
    setTotals({ totalHT: ht, totalVAT: vat, totalTTC: ht + vat })
  }, [invoice])

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = parseInt(e.target.value)
    if (invoice) {
      const updatedInvoice = { ...invoice, status: newStatus }
      setInvoice(updatedInvoice)
    }
  }

  useEffect(() => {
    setIsSaveDisabled(
      JSON.stringify(invoice) === JSON.stringify(initialInvoice)
    )
  }, [invoice, initialInvoice])

  const handleSave = async () => {
    if (!invoice) return;
    setIsLoading(true)
    try {
      await updateInvoice(invoice)
      const updatedInvoice = await getInvoiceById(invoice.id)
      if (updatedInvoice) {
        setInvoice(updatedInvoice)
        setInitialInvoice(updatedInvoice)
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la facture :", error);
    }
  }

  const handleDelete = async () => {
    try {
      await deleteInvoice(invoice?.id as string)
      router.push("/")
    } catch (error) {
      console.error("Erreur lors de la suppression de la facture.", error);
    }
  }

  if (!invoice || !totals) return (
    <div className='flex justify-center items-center h-screen w-full'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500'></div>
    </div>
  )

  return (
    <Wrapper>
      <>
        <div>
          <div className='flex flex-col md:flex-row md:justify-between md:items-center mb-4'>
            <p className='badge badge-ghost badge-lg uppercase'>
              <span>Facture-</span>{invoice?.id}
            </p>
            <div className='flex md:mt-0 mt-4'>
              <select
                className='select select-sm select-bordered w-full'
                value={invoice?.status}
                onChange={handleStatusChange}
              >
                <option value={1}>Brouillon</option>
                <option value={2}>En attente</option>
                <option value={3}>Payée</option>
                <option value={4}>Annulée</option>
                <option value={5}>Impayée</option>
              </select>

              <button 
                className='btn btn-sm btn-accent ml-4'
                disabled={isSaveDisabled || isLoading}
                onClick={handleSave}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    Sauvegarder
                    <Save className="w-4 ml-2" />
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className='btn btn-sm btn-error ml-4'
              >
                <Trash className='w-4' />
              </button>
            </div>
          </div>

          <div className='flex flex-col md:flex-row w-full'>
            <div className='flex w-full md:w-1/3 flex-col'>
              <div className='mb-4 bg-base-200 rounded-xl p-7'>
                <div className='flex justify-between items-center mb-4'>
                  <div className='badge badge-accent'>Totaux</div>
                  <VATControl invoice={invoice} setInvoice={setInvoice} />
                </div>

                <div className='flex justify-between'>
                  <span>Total Hors Taxes</span>
                  <span>{totals.totalHT.toFixed(2)} €</span>
                </div>

                <div className='flex justify-between'>
                  <span>TVA ({invoice?.vatActive ? `${invoice?.vatRate}` : '0'} %)</span>
                  <span>{totals.totalVAT.toFixed(2)} €</span>
                </div>

                <div className='flex justify-between font-bold'>
                  <span>Total TTC</span>
                  <span>{totals.totalTTC.toFixed(2)} €</span>
                </div>
              </div>

              <InvoiceInfo invoice={invoice} setInvoice={setInvoice} />
            </div>

            <div className='flex w-full md:w-2/3 flex-col md:ml-4'>
              <InvoiceLines invoice={invoice} setInvoice={setInvoice} />
              <InvoicePDF invoice={invoice} totals={totals} />
            </div>
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirmation
              </h3>
              <p className="py-4 text-lg">
                Êtes-vous sûr de vouloir supprimer cette facture ?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Cette action est irréversible.
              </p>
              <div className="modal-action">
                <button 
                  className="btn btn-error" 
                  onClick={() => {
                    handleDelete()
                    setShowDeleteModal(false)
                  }}
                >
                  Oui, supprimer
                </button>
                <button 
                  className="btn" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
          </div>
        )}
      </>
    </Wrapper>
  )
}

export default Page