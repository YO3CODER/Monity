'use client'

import React, { useState } from 'react'
import { getBudgets, syncInvoiceToBudget, BudgetOption } from '../budgetActions'

const BudgetSyncButton: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const [budgets, setBudgets] = useState<BudgetOption[] | null>(null)
  const [budgetId, setBudgetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const loadBudgets = async () => {
    try {
      setLoading(true)
      setMessage('')
      setBudgets(await getBudgets())
    } catch {
      setIsError(true)
      setMessage('Impossible de charger les budgets.')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setLoading(true)
      setMessage('')
      const result = await syncInvoiceToBudget(invoiceId, budgetId)
      if (result.ok) {
        setIsError(false)
        setMessage(
          result.sent > 0
            ? `${result.sent.toFixed(0)} FCFA ajoutés au budget.`
            : 'Rien de nouveau à ajouter.'
        )
      } else {
        setIsError(true)
        setMessage(`Erreur : ${result.error}`)
      }
    } catch {
      setIsError(true)
      setMessage("Erreur : l'ajout au budget a échoué.")
    } finally {
      setLoading(false)
    }
  }

  if (!budgets) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="btn btn-sm btn-accent btn-outline"
          onClick={loadBudgets}
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Ajouter au budget'}
        </button>
        {message && <p className="text-sm text-error break-words">{message}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <select
        className="select select-bordered select-sm w-full"
        value={budgetId}
        onChange={(e) => setBudgetId(e.target.value)}
      >
        <option value="">Choisir un budget</option>
        {budgets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-sm btn-accent w-full"
        onClick={handleSync}
        disabled={!budgetId || loading}
      >
        {loading ? 'Envoi...' : "Ajouter l'encaissement"}
      </button>
      {message && (
        <p className={`text-sm break-words ${isError ? 'text-error' : 'text-gray-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default BudgetSyncButton