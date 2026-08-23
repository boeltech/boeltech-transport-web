/**
 * Listado de facturas del hub Finanzas via GET /invoices.
 *
 * El tab mapea solo los campos que necesita la tabla/KPI. El DTO API completo
 * (tenant_id, subtotales, etc.) lo comparte también invoicingApi.getAll —
 * recorte de superficie en el endpoint queda post-v1 (auditoría H11).
 */

import { apiClient } from "@shared/api";
import type { ApiPagination } from "@shared/api";
import type {
  FinanceInvoiceListFilters,
  FinanceInvoiceListItem,
  FinanceInvoiceStatus,
  PaginatedFinanceInvoices,
} from "@features/finance/domain";
import { parseInvoiceBillingScope } from "@features/invoicing";

const INVOICES = "/invoices";

function mapInvoiceListItem(raw: Record<string, unknown>): FinanceInvoiceListItem {
  const total = Number(raw.total ?? 0);
  const balanceDue = Number(raw.balance_due ?? 0);
  const totalPaidRaw = raw.total_paid;
  const totalPaid =
    totalPaidRaw == null
      ? Math.max(0, Number((total - balanceDue).toFixed(2)))
      : Number(totalPaidRaw);

  return {
    id: String(raw.id ?? ""),
    serie: String(raw.serie ?? ""),
    folio: Number(raw.folio ?? 0),
    receiverRfc: String(raw.receiver_rfc ?? ""),
    receiverName: String(raw.receiver_name ?? ""),
    issuedAt: String(raw.issued_at ?? ""),
    paymentMethod: String(raw.payment_method ?? ""),
    total,
    balanceDue,
    totalPaid: Number.isFinite(totalPaid) ? totalPaid : 0,
    tripCodes: Array.isArray(raw.trip_codes)
      ? raw.trip_codes.map((code) => String(code))
      : [],
    status: String(raw.status ?? "draft") as FinanceInvoiceStatus,
    billingScope: raw.billing_scope
      ? parseInvoiceBillingScope(String(raw.billing_scope))
      : undefined,
    sharePercent:
      raw.share_percent == null ? null : Number(raw.share_percent),
  };
}

export const financeInvoicesListApi = {
  getAll: async (
    filters?: FinanceInvoiceListFilters,
  ): Promise<PaginatedFinanceInvoices> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const qs = params.toString();
    const response = await apiClient.get<{
      data: unknown[];
      pagination: ApiPagination;
    }>(`${INVOICES}${qs ? `?${qs}` : ""}`);

    return {
      data: (response.data as unknown[]).map((item) =>
        mapInvoiceListItem(item as Record<string, unknown>),
      ),
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      },
    };
  },
};
