// /type.ts (ou /types/index.ts)

/**
 * Types pour les lignes de facture
 */
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  invoiceId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Types pour les factures
 */
export interface Invoice {
  id: string;
  name: string;
  userId: string;
  issuerName: string;
  issuerAddress: string;
  clientName: string;
  clientAddress: string;
  invoiceDate: string;
  dueDate: string;
  vatActive: boolean;
  vatRate: number;
  status: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  lines: InvoiceLine[]; // Relation avec les lignes
}

/**
 * Types pour les totaux calculés
 */
export interface Totals {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

/**
 * Types utilitaires pour la création (champs optionnels)
 */
export interface InvoiceCreateInput {
  name: string;
  userId: string;
  issuerName?: string;
  issuerAddress?: string;
  clientName?: string;
  clientAddress?: string;
  invoiceDate?: string;
  dueDate?: string;
  vatActive?: boolean;
  vatRate?: number;
  status?: number;
}

/**
 * Types utilitaires pour la mise à jour
 */
export interface InvoiceUpdateInput {
  name?: string;
  issuerName?: string;
  issuerAddress?: string;
  clientName?: string;
  clientAddress?: string;
  invoiceDate?: string;
  dueDate?: string;
  vatActive?: boolean;
  vatRate?: number;
  status?: number;
  lines?: InvoiceLine[];
}

/**
 * Types pour l'utilisateur (si nécessaire)
 */
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * Fonctions utilitaires de transformation
 */
export function toInvoice(dbInvoice: any, lines: any[] = []): Invoice {
  return {
    id: dbInvoice.id,
    name: dbInvoice.name,
    userId: dbInvoice.userId,
    issuerName: dbInvoice.issuerName || '',
    issuerAddress: dbInvoice.issuerAddress || '',
    clientName: dbInvoice.clientName || '',
    clientAddress: dbInvoice.clientAddress || '',
    invoiceDate: dbInvoice.invoiceDate || '',
    dueDate: dbInvoice.dueDate || '',
    vatActive: Boolean(dbInvoice.vatActive),
    vatRate: Number(dbInvoice.vatRate) || 20,
    status: Number(dbInvoice.status) || 0,
    createdAt: dbInvoice.createdAt ? new Date(dbInvoice.createdAt) : null,
    updatedAt: dbInvoice.updatedAt ? new Date(dbInvoice.updatedAt) : null,
    lines: lines.map(line => toInvoiceLine(line))
  };
}

export function toInvoiceLine(dbLine: any): InvoiceLine {
  return {
    id: dbLine.id,
    description: dbLine.description,
    quantity: Number(dbLine.quantity),
    unitPrice: Number(dbLine.unitPrice),
    invoiceId: dbLine.invoiceId,
    createdAt: dbLine.createdAt ? new Date(dbLine.createdAt) : null,
    updatedAt: dbLine.updatedAt ? new Date(dbLine.updatedAt) : null
  };
}

export function toUser(dbUser: any): User {
  return {
    id: dbUser.id,
    clerk_id: dbUser.clerk_id,
    email: dbUser.email,
    name: dbUser.name || null,
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt) : null,
    updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt) : null
  };
}