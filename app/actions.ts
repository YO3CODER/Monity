// app/actions.ts
"use server";

import sql from '@/lib/neon';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Invoice, toInvoice, toUser, User } from "@/type";
import { randomBytes } from "crypto";

/* =========================
   UTILISATEUR
========================= */
export async function getOrCreateUser(): Promise<User | null> {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) return null;

    // Vérifier si l'utilisateur existe avec clerk_id
    const existingUsers = await sql`
      SELECT * FROM "User" WHERE clerk_id = ${userId} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return toUser(existingUsers[0]);
    }

    // Créer le nouvel utilisateur
    const email = user.emailAddresses[0]?.emailAddress;
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || email;

    const newUsers = await sql`
      INSERT INTO "User" (clerk_id, email, name)
      VALUES (${userId}, ${email}, ${name})
      RETURNING *
    `;

    return toUser(newUsers[0]);

  } catch (error) {
    console.error('Erreur getOrCreateUser:', error);
    return null;
  }
}

/* =========================
   GENERATEUR ID
========================= */
const generateUniqueId = async (): Promise<string> => {
  let uniqueId = '';
  let isUnique = false;

  while (!isUnique) {
    uniqueId = randomBytes(3).toString("hex");
    const existing = await sql`
      SELECT id FROM "Invoice" WHERE id = ${uniqueId} LIMIT 1
    `;
    if (existing.length === 0) isUnique = true;
  }

  return uniqueId;
};

/* =========================
   CREER FACTURE
========================= */
export async function createEmptyInvoice(name: string): Promise<Invoice | null> {
  try {
    const user = await getOrCreateUser();
    if (!user) return null;

    const invoiceId = await generateUniqueId();

    const [newInvoice] = await sql`
      INSERT INTO "Invoice" (
        id, name, "userId", "issuerName", "issuerAddress", 
        "clientName", "clientAddress", "invoiceDate", "dueDate", 
        "vatActive", "vatRate", status
      ) VALUES (
        ${invoiceId}, ${name}, ${user.id}, '', '', 
        '', '', '', '', 
        false, 20, 0
      )
      RETURNING *
    `;

    return toInvoice(newInvoice, []);

  } catch (error) {
    console.error('Erreur createEmptyInvoice:', error);
    return null;
  }
}

/* =========================
   RECUPERER FACTURES
========================= */
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const user = await getOrCreateUser();
    if (!user) return [];

    const invoices = await sql`
      SELECT * FROM "Invoice" 
      WHERE "userId" = ${user.id}
      ORDER BY "createdAt" DESC
    `;

    const today = new Date();

    // Récupérer les lignes pour chaque facture et mettre à jour les statuts
    const invoicesWithLines = await Promise.all(
      invoices.map(async (invoice) => {
        // Mettre à jour le statut si dépassé
        if (invoice.dueDate && invoice.status === 2) {
          const dueDate = new Date(invoice.dueDate);
          if (dueDate < today) {
            const [updated] = await sql`
              UPDATE "Invoice" 
              SET status = 5 
              WHERE id = ${invoice.id}
              RETURNING *
            `;
            invoice = updated;
          }
        }

        // Récupérer les lignes
        const lines = await sql`
          SELECT * FROM "InvoiceLine" 
          WHERE "invoiceId" = ${invoice.id}
          ORDER BY id
        `;

        return toInvoice(invoice, lines);
      })
    );

    return invoicesWithLines;

  } catch (error) {
    console.error('Erreur getInvoices:', error);
    return [];
  }
}

/* =========================
   RECUPERER UNE FACTURE
========================= */
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  try {
    if (!invoiceId) return null;

    const [invoice] = await sql`
      SELECT * FROM "Invoice" 
      WHERE id = ${invoiceId} 
      LIMIT 1
    `;

    if (!invoice) return null;

    const lines = await sql`
      SELECT * FROM "InvoiceLine" 
      WHERE "invoiceId" = ${invoiceId}
      ORDER BY id
    `;

    return toInvoice(invoice, lines);

  } catch (error) {
    console.error('Erreur getInvoiceById:', error);
    return null;
  }
}

/* =========================
   METTRE A JOUR FACTURE
========================= */
export async function updateInvoice(invoice: Invoice): Promise<boolean | null> {
  try {
    if (!invoice?.id) return null;

    // Vérifier si la facture existe
    const [existing] = await sql`
      SELECT * FROM "Invoice" WHERE id = ${invoice.id} LIMIT 1
    `;
    if (!existing) return null;

    // Mettre à jour la facture
    await sql`
      UPDATE "Invoice" SET
        "issuerName" = ${invoice.issuerName},
        "issuerAddress" = ${invoice.issuerAddress},
        "clientName" = ${invoice.clientName},
        "clientAddress" = ${invoice.clientAddress},
        "invoiceDate" = ${invoice.invoiceDate},
        "dueDate" = ${invoice.dueDate},
        "vatActive" = ${invoice.vatActive},
        "vatRate" = ${invoice.vatRate},
        status = ${invoice.status}
      WHERE id = ${invoice.id}
    `;

    // Récupérer les lignes existantes
    const existingLines = await sql`
      SELECT * FROM "InvoiceLine" 
      WHERE "invoiceId" = ${invoice.id}
    `;

    const receivedLines = invoice.lines || [];

    // Supprimer les lignes qui ne sont plus présentes
    const linesToDelete = existingLines.filter(
      (existingLine) => !receivedLines.some((line) => line.id === existingLine.id)
    );

    if (linesToDelete.length > 0) {
      const idsToDelete = linesToDelete.map(line => line.id);
      await sql`
        DELETE FROM "InvoiceLine" 
        WHERE id = ANY(${idsToDelete}::text[])
      `;
    }

    // Mettre à jour ou créer les lignes
    for (const line of receivedLines) {
      const existingLine = existingLines.find((l) => l.id === line.id);

      if (existingLine) {
        // Mise à jour si changé
        if (line.description !== existingLine.description ||
            line.quantity !== existingLine.quantity ||
            line.unitPrice !== existingLine.unitPrice) {
          await sql`
            UPDATE "InvoiceLine" SET
              description = ${line.description},
              quantity = ${line.quantity},
              "unitPrice" = ${line.unitPrice}
            WHERE id = ${line.id}
          `;
        }
      } else {
        // Nouvelle ligne
        await sql`
          INSERT INTO "InvoiceLine" (
            description, quantity, "unitPrice", "invoiceId"
          ) VALUES (
            ${line.description}, ${line.quantity}, ${line.unitPrice}, ${invoice.id}
          )
        `;
      }
    }

    return true;

  } catch (error) {
    console.error('Erreur updateInvoice:', error);
    return null;
  }
}

/* =========================
   SUPPRIMER FACTURE
========================= */
export async function deleteInvoice(invoiceId: string): Promise<any | null> {
  try {
    if (!invoiceId) return null;

    const [deleted] = await sql`
      DELETE FROM "Invoice" 
      WHERE id = ${invoiceId}
      RETURNING *
    `;

    return deleted;

  } catch (error) {
    console.error('Erreur deleteInvoice:', error);
    return null;
  }
}