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

async function postTransaction(email: string, budgetId: string, amount: number, description: string) {
  const res = await fetch(`${process.env.BUDGET_API_URL}/api/external/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.BUDGET_API_KEY!,
    },
    body: JSON.stringify({ email, budgetId, amount, description }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new Error(`App budget : statut ${res.status} ${body}`)
  }
}

export async function syncInvoiceToBudget(
  invoiceId: string,
  budgetId: string
): Promise<SyncResult> {
  try {
    const { id: clerkId, email } = await getUser()

    // 1. La facture existe-t-elle en base ?
    const invoiceRows = await sql`
      SELECT id, name, "clientName", status, "advanceAmount", "budgetSyncedAmount", "userId"
      FROM "Invoice"
      WHERE id = ${invoiceId}
    `
    const invoice = invoiceRows[0]
    if (!invoice) {
      return { ok: false, error: `Facture "${invoiceId}" absente de la base. Enregistre-la d'abord.` }
    }

    // 2. Appartient-elle au compte connecté ?
    const ownerRows = await sql`
      SELECT id FROM "User"
      WHERE id = ${invoice.userId}
        AND (clerk_id = ${clerkId} OR lower(email) = lower(${email}))
    `
    const directMatch = invoice.userId === clerkId || invoice.userId === email
    if (!directMatch && ownerRows.length === 0) {
      return { ok: false, error: `Cette facture appartient à un autre compte (connecté : ${email}).` }
    }

    // 3. Total TTC depuis la vue
    const totalRows = await sql`
      SELECT total FROM "InvoiceWithTotals" WHERE id = ${invoiceId}
    `
    if (totalRows.length === 0) {
      return { ok: false, error: 'Totaux introuvables pour cette facture (ajoute au moins une ligne).' }
    }

    const total = Number(totalRows[0].total) || 0
    const advance = Math.min(Math.max(Number(invoice.advanceAmount) || 0, 0), total)

    // Encaissé : tout si la facture est payée, sinon l'avance seule
    const collected = invoice.status === STATUS_PAID ? total : advance
    let synced = Number(invoice.budgetSyncedAmount) || 0

    // Deux paiements possibles : l'avance, puis le solde
    const fromAdvance = Math.max(0, Math.min(advance, collected) - synced)
    const fromBalance = Math.max(0, collected - Math.max(synced, advance))

    const label = [invoice.clientName, invoice.name].filter(Boolean).join(' : ') || `Facture ${invoiceId}`

    const parts: { amount: number; description: string }[] = []
    if (fromAdvance > 0) {
      parts.push({ amount: fromAdvance, description: `${label} (avance)` })
    }
    if (fromBalance > 0) {
      parts.push({
        amount: fromBalance,
        description: advance > 0 ? `${label} (solde - paiement final)` : `${label} (paiement)`,
      })
    }

    if (parts.length === 0) return { ok: true, sent: 0 }

    let sent = 0
    for (const part of parts) {
      await postTransaction(email, budgetId, part.amount, part.description)
      synced += part.amount
      sent += part.amount

      // On enregistre après chaque paiement envoyé, pour ne jamais créer de doublon
      await sql`
        UPDATE "Invoice"
        SET "budgetId" = ${budgetId}, "budgetSyncedAmount" = ${synced}
        WHERE id = ${invoiceId}
      `
    }

    return { ok: true, sent }
  } catch (e) {
    console.error('syncInvoiceToBudget', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}