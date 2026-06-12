import { apiClient } from "@shared/api";
import type {
  AccountStatementItem,
  AgingByClientItem,
  AgingClientInvoiceItem,
  AgingSummary,
  ExpensesByCategory,
  ExpensesByCategoryFilters,
  ExpensesByDimensionFilters,
  ExpensesByDimensionItem,
  FinanceSummary,
  IncomeByMonth,
  IncomeByMonthFilters,
  InvoicesByStatusMonth,
  InvoicesByStatusMonthFilters,
  ProfitabilityAggregateFilters,
  ProfitabilityAggregateItem,
  ProfitabilityTripsFilters,
  ProfitabilityTripsResponse,
} from "@features/finance/domain";
import {
  mapAccountStatementItem,
  mapAgingByClientItem,
  mapAgingClientInvoiceItem,
  mapAgingSummary,
  mapExpensesByCategory,
  mapExpensesByDimensionItem,
  mapFinanceSummary,
  mapIncomeByMonth,
  mapInvoicesByStatusMonth,
  mapProfitabilityAggregateItem,
  mapProfitabilityTripsResponse,
} from "./mappers";

const FINANCE_BASE = "/finance";

const profitabilityTripsSortByApi: Record<
  NonNullable<ProfitabilityTripsFilters["sortBy"]>,
  string
> = {
  scheduledDeparture: "scheduled_departure",
  revenue: "revenue",
  actualTotal: "actual_total",
  grossMarginPct: "gross_margin_pct",
};

const profitabilityAggregateSortByApi: Record<
  NonNullable<ProfitabilityAggregateFilters["sortBy"]>,
  string
> = {
  tripCount: "trip_count",
  totalRevenue: "total_revenue",
  totalActual: "total_actual",
  blendedMargin: "blended_margin",
  blendedMarginPct: "blended_margin_pct",
};

const expensesDimensionSortByApi: Record<
  NonNullable<ExpensesByDimensionFilters["sortBy"]>,
  string
> = {
  total: "total",
  tripCount: "trip_count",
  avgExpensePerTrip: "avg_expense_per_trip",
};

function addOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value !== undefined && value !== "") {
    params.append(key, String(value));
  }
}

export const financeApi = {
  getFinanceSummary: async (): Promise<FinanceSummary> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE_BASE}/summary`,
    );
    return mapFinanceSummary(response.data as Record<string, unknown>);
  },

  getAccountStatement: async (): Promise<AccountStatementItem[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/account-statement`,
    );
    return (response.data ?? []).map((item) =>
      mapAccountStatementItem(item as Record<string, unknown>),
    );
  },

  getProfitabilityTrips: async (
    filters: ProfitabilityTripsFilters = {},
  ): Promise<ProfitabilityTripsResponse> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "from", filters.from);
    addOptionalParam(params, "to", filters.to);
    addOptionalParam(params, "client_id", filters.clientId);
    addOptionalParam(params, "vehicle_id", filters.vehicleId);
    addOptionalParam(params, "driver_id", filters.driverId);
    addOptionalParam(params, "origin", filters.origin);
    addOptionalParam(params, "destination", filters.destination);
    if (filters.sortBy) {
      addOptionalParam(
        params,
        "sort_by",
        profitabilityTripsSortByApi[filters.sortBy],
      );
    }
    addOptionalParam(params, "sort_order", filters.sortOrder);
    addOptionalParam(params, "page", filters.page ?? 1);
    addOptionalParam(params, "limit", filters.limit ?? 20);
    addOptionalParam(params, "scope", filters.scope);
    if (filters.profitabilityStatus?.length) {
      for (const status of filters.profitabilityStatus) {
        params.append("profitability_status", status);
      }
    }

    const qs = params.toString();
    const response = await apiClient.get<unknown>(
      `${FINANCE_BASE}/profitability/trips${qs ? `?${qs}` : ""}`,
    );
    return mapProfitabilityTripsResponse(response as Record<string, unknown>);
  },

  getProfitabilityAggregate: async (
    filters: ProfitabilityAggregateFilters,
  ): Promise<ProfitabilityAggregateItem[]> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "dimension", filters.dimension);
    addOptionalParam(params, "from", filters.from);
    addOptionalParam(params, "to", filters.to);
    if (filters.sortBy) {
      addOptionalParam(
        params,
        "sort_by",
        profitabilityAggregateSortByApi[filters.sortBy],
      );
    }
    addOptionalParam(params, "sort_order", filters.sortOrder);
    addOptionalParam(params, "scope", filters.scope);
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/profitability/aggregate${qs ? `?${qs}` : ""}`,
    );
    return (response.data ?? []).map((item) =>
      mapProfitabilityAggregateItem(item as Record<string, unknown>),
    );
  },

  getAgingSummary: async (): Promise<AgingSummary> => {
    const response = await apiClient.get<{ data: unknown }>(`${FINANCE_BASE}/aging`);
    return mapAgingSummary(response.data as Record<string, unknown>);
  },

  getAgingByClient: async (clientRfc?: string): Promise<AgingByClientItem[]> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "client_rfc", clientRfc);
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/aging/by-client${qs ? `?${qs}` : ""}`,
    );
    return (response.data ?? []).map((item) =>
      mapAgingByClientItem(item as Record<string, unknown>),
    );
  },

  getAgingClientInvoices: async (
    clientRfc: string,
  ): Promise<AgingClientInvoiceItem[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/aging/client/${clientRfc}/invoices`,
    );
    return (response.data ?? []).map((item) =>
      mapAgingClientInvoiceItem(item as Record<string, unknown>),
    );
  },

  getExpensesByCategory: async (
    filters: ExpensesByCategoryFilters = {},
  ): Promise<ExpensesByCategory> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "from", filters.from);
    addOptionalParam(params, "to", filters.to);
    addOptionalParam(params, "granularity", filters.granularity ?? "month");
    addOptionalParam(params, "vehicle_id", filters.vehicleId);
    addOptionalParam(params, "driver_id", filters.driverId);
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE_BASE}/expenses/by-category${qs ? `?${qs}` : ""}`,
    );
    return mapExpensesByCategory(response.data as Record<string, unknown>);
  },

  getExpensesByDimension: async (
    filters: ExpensesByDimensionFilters,
  ): Promise<ExpensesByDimensionItem[]> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "dimension", filters.dimension);
    addOptionalParam(params, "from", filters.from);
    addOptionalParam(params, "to", filters.to);
    addOptionalParam(params, "category", filters.category);
    const expenseSortBy = filters.sortBy ?? "total";
    addOptionalParam(
      params,
      "sort_by",
      expensesDimensionSortByApi[expenseSortBy],
    );
    addOptionalParam(params, "sort_order", filters.sortOrder ?? "desc");
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/expenses/by-dimension${qs ? `?${qs}` : ""}`,
    );
    return (response.data ?? []).map((item) =>
      mapExpensesByDimensionItem(item as Record<string, unknown>),
    );
  },

  getIncomeByMonth: async (
    filters: IncomeByMonthFilters = {},
  ): Promise<IncomeByMonth> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "months", filters.months ?? 12);
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE_BASE}/income-by-month${qs ? `?${qs}` : ""}`,
    );
    return mapIncomeByMonth(response.data as Record<string, unknown>);
  },

  getInvoicesByStatusMonth: async (
    filters: InvoicesByStatusMonthFilters = {},
  ): Promise<InvoicesByStatusMonth> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "months", filters.months ?? 12);
    const qs = params.toString();

    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE_BASE}/invoices-by-status-month${qs ? `?${qs}` : ""}`,
    );
    return mapInvoicesByStatusMonth(response.data as Record<string, unknown>);
  },
};
