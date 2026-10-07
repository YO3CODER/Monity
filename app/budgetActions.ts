'use server'

import { currentUser } from '@clerk/nextjs/server'
import { sql } from '@/lib/neon' // même import que dans app/actions.ts
import { STATUS_PAID } from '@/lib/balance'

export type BudgetOption = { id: string | number; name: string; amount: number }

export type SyncResult =
  | { ok: true; sent: number }
  | { ok: false; error: string }

async function getUser() {
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!user || !email) throw new Error('Non connecté')
  return { id: user.id, email }
}

export async function getBudgets(): Promise<BudgetOption[]> {
  const { email } = await getUser()
  const res = await fetch(
    `${process.env.BUDGET_API_URL}/api/external/budgets?email=${encodeURIComponent(email)}`,
    { headers: { 'x-api-key': process.env.BUDGET_API_KEY! }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error('Impossible de charger les budgets')
  return res.json()
}

export async function syncInvoiceToBudget(
  invoiceId: string,
  budgetId: string
): Promise<SyncResult> {
  try {
    const { id: userId, email } = await getUser()

    // Facture + total TTC, uniquement si elle appartient à l'utilisateur
    // (userId peut contenir l'identifiant Clerk ou l'e-mail selon la façon dont la facture a été créée)
    const rows = await sql`
      SELECT i.name, i."clientName", i.status, i."advanceAmount", i."budgetSyncedAmount", t.total
      FROM "Invoice" i
      JOIN "InvoiceWithTotals" t ON t.id = i.id
      WHERE i.id = ${invoiceId}
        AND (i."userId" = ${userId} OR i."userId" = ${email})
    `
    const invoice = rows[0]
    if (!invoice) {
      return { ok: false, error: 'Facture introuvable (userId différent ou facture non enregistrée).' }
    }

    const total = Number(invoice.total) || 0
    const advance = Math.min(Math.max(Number(invoice.advanceAmount) || 0, 0), total)

    // Montant encaissé : tout si la facture est payée, sinon l'avance
    const collected = invoice.status === STATUS_PAID ? total : advance
    const alreadySynced = Number(invoice.budgetSyncedAmount) || 0
    const delta = collected - alreadySynced

    if (delta <= 0) return { ok: true, sent: 0 }

    const label = [invoice.clientName, invoice.name].filter(Boolean).join(' : ')

    const res = await fetch(`${process.env.BUDGET_API_URL}/api/external/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.BUDGET_API_KEY!,
      },
      body: JSON.stringify({
        email,
        budgetId,
        amount: delta,
        description: label || `Facture ${invoiceId}`,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = (await res.text()).slice(0, 200)
      return { ok: false, error: `App budget : statut ${res.status} ${body}` }
    }

    await sql`
      UPDATE "Invoice"
      SET "budgetId" = ${budgetId}, "budgetSyncedAmount" = ${alreadySynced + delta}
      WHERE id = ${invoiceId}
    `
    return { ok: true, sent: delta }
  } catch (e) {
    console.error('syncInvoiceToBudget', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}