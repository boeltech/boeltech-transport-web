/**
 * Fila de GET /trips/:tripId/invoices — CFDI ingreso ligados al viaje
 * (todos los scopes/status, cadena de sustitución; sin REP).
 */
import type {
  InvoiceBillingScope,
  InvoiceStatus,
} from "@features/invoicing/domain";

export interface TripLinkedInvoice {
  readonly id: string;
  readonly serie: string;
  readonly folio: number;
  readonly status: InvoiceStatus;
  readonly billingScope: InvoiceBillingScope;
  readonly splitLegId: string | null;
  readonly attachCartaPorte: boolean;
  readonly sharePercent: number | null;
  readonly total: number;
  readonly totalPaid: number;
  readonly balanceDue: number;
  readonly stampedAt: string | null;
  readonly parentInvoiceId: string | null;
  readonly createdAt: string;
}
