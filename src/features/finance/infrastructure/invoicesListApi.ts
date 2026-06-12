import { apiClient } from "@shared/api";
import type {
  FinanceInvoiceListFilters,
  FinanceInvoiceListItem,
  FinanceInvoiceStatus,
  PaginatedFinanceInvoices,
} from "@features/finance/domain";

const INVOICES = "/invoices";

function mapInvoiceListItem(raw: Record<string, unknown>): FinanceInvoiceListItem {
  return {
    id: String(raw.id ?? ""),
    serie: String(raw.serie ?? ""),
    folio: Number(raw.folio ?? 0),
    receiverRfc: String(raw.receiver_rfc ?? ""),
    receiverName: String(raw.receiver_name ?? ""),
    issuedAt: String(raw.issued_at ?? ""),
    paymentMethod: String(raw.payment_method ?? ""),
    total: Number(raw.total ?? 0),
    balanceDue: Number(raw.balance_due ?? 0),
    tripCodes: Array.isArray(raw.trip_codes)
      ? raw.trip_codes.map((code) => String(code))
      : [],
    status: String(raw.status ?? "draft") as FinanceInvoiceStatus,
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
      pagination: PaginatedFinanceInvoices["pagination"];
    }>(`${INVOICES}${qs ? `?${qs}` : ""}`);

    return {
      data: (response.data as unknown[]).map((item) =>
        mapInvoiceListItem(item as Record<string, unknown>),
      ),
      pagination: response.pagination,
    };
  },
};
