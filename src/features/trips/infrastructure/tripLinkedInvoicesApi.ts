/**
 * GET /trips/:tripId/invoices — libro de cobro del viaje (F2).
 */
import { apiClient, deepToCamel } from "@shared/api";
import {
  parseInvoiceBillingScope,
  type InvoiceStatus,
} from "@features/invoicing/domain";
import type { TripLinkedInvoice } from "@features/trips/domain";

const endpoint = (tripId: string) => `/trips/${tripId}/invoices`;

type Envelope = { data: unknown };

const INVOICE_STATUSES: ReadonlySet<InvoiceStatus> = new Set([
  "draft",
  "stamping",
  "stamped",
  "cancellation_pending",
  "cancelled",
]);

function parseStatus(raw: unknown): InvoiceStatus {
  if (typeof raw === "string" && INVOICE_STATUSES.has(raw as InvoiceStatus)) {
    return raw as InvoiceStatus;
  }
  return "draft";
}

export function mapTripLinkedInvoice(raw: unknown): TripLinkedInvoice {
  const row = deepToCamel(raw) as {
    id: string;
    serie?: string;
    folio?: number;
    status?: string;
    billingScope?: string;
    splitLegId?: string | null;
    attachCartaPorte?: boolean;
    sharePercent?: number | null;
    total?: number;
    totalPaid?: number;
    balanceDue?: number;
    stampedAt?: string | null;
    parentInvoiceId?: string | null;
    createdAt?: string;
  };
  return {
    id: String(row.id),
    serie: String(row.serie ?? ""),
    folio: Number(row.folio ?? 0),
    status: parseStatus(row.status),
    billingScope: parseInvoiceBillingScope(row.billingScope),
    splitLegId: row.splitLegId ?? null,
    attachCartaPorte: Boolean(row.attachCartaPorte),
    sharePercent:
      row.sharePercent == null || Number.isNaN(Number(row.sharePercent))
        ? null
        : Number(row.sharePercent),
    total: Number(row.total ?? 0),
    totalPaid: Number(row.totalPaid ?? 0),
    balanceDue: Number(row.balanceDue ?? 0),
    stampedAt: row.stampedAt ?? null,
    parentInvoiceId: row.parentInvoiceId ?? null,
    createdAt: String(row.createdAt ?? ""),
  };
}

export const tripLinkedInvoicesApi = {
  async list(tripId: string): Promise<TripLinkedInvoice[]> {
    const response = await apiClient.get<Envelope>(endpoint(tripId));
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data.map(mapTripLinkedInvoice);
  },
};
