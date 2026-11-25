import { apiClient } from "@shared/api";
import type {
  AccountStatementItem,
  AccountStatementTarget,
  PendingRelationCount,
  PendingRelationFileFormat,
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
  MonthlyPerformance,
  ProfitabilityAggregateFilters,
  ProfitabilityAggregateItem,
  ProfitabilityTripsFilters,
  ProfitabilityTripsResponse,
  CollectionsWeek,
} from "@features/finance/domain";
import {
  mapAccountStatementItem,
  mapPendingRelationCount,
  mapAgingByClientItem,
  mapAgingClientInvoiceItem,
  mapAgingSummary,
  mapCollectionsWeek,
  mapExpensesByCategory,
  mapExpensesByDimensionItem,
  mapFinanceSummary,
  mapIncomeByMonth,
  mapInvoicesByStatusMonth,
  mapMonthlyPerformance,
  mapProfitabilityAggregateItem,
  mapProfitabilityTripsResponse,
} from "./mappers";

const FINANCE_BASE = "/finance";

/** Filename local de respaldo si el header Content-Disposition no trae nombre. */
export function buildAccountStatementPdfFileName(clientRfc: string): string {
  const rfc = clientRfc.trim().toUpperCase();
  return `estado-cuenta-${rfc}.pdf`;
}

export function buildAccountStatementCsvFileName(clientRfc: string): string {
  const rfc = clientRfc.trim().toUpperCase();
  return `estado-cuenta-${rfc}.csv`;
}

/** Query y nombre de archivo del Estado de cuenta de un cliente. */
function accountStatementRequest(target: AccountStatementTarget): {
  params: URLSearchParams;
  fileKey: string;
} {
  const params = new URLSearchParams();
  if ("clientRfc" in target) {
    const rfc = target.clientRfc.trim().toUpperCase();
    addOptionalParam(params, "client_rfc", rfc);
    return { params, fileKey: rfc };
  }
  addOptionalParam(params, "client_id", target.clientId);
  const slug = target.clientName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return { params, fileKey: slug || "cliente" };
}

export interface AccountStatementDownloadOptions {
  includeInvoices?: boolean;
  includeOperational?: boolean;
}

/** Nombre de respaldo: el corte sale de `generated_on`, no del reloj del navegador. */
export function buildPendingRelationFileName(
  clientRfc: string,
  generatedOn: string,
  format: PendingRelationFileFormat,
): string {
  const rfc = clientRfc.trim().toUpperCase().replace(/\s+/g, "");
  return `relacion-pendientes-${rfc}-${generatedOn}.${format}`;
}

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

  /** GET /finance/collections-week — Cobrado esta semana (lun–dom CDMX). */
  getCollectionsWeek: async (): Promise<CollectionsWeek> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE_BASE}/collections-week`,
    );
    return mapCollectionsWeek(
      (response.data ?? {}) as Record<string, unknown>,
    );
  },

  getAccountStatement: async (): Promise<AccountStatementItem[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE_BASE}/account-statement`,
    );
    return (response.data ?? []).map((item) =>
      mapAccountStatementItem(item as Record<string, unknown>),
    );
  },

  /**
   * PDF del Estado de cuenta de un cliente, con detalle por factura y viaje.
   * GET /finance/account-statement/pdf?client_rfc= | client_id= — finance.read.
   */
  downloadAccountStatementPdf: async (
    target: AccountStatementTarget,
  ): Promise<void> => {
    const { params, fileKey } = accountStatementRequest(target);
    await apiClient.downloadFile(
      `${FINANCE_BASE}/account-statement/pdf?${params.toString()}`,
      buildAccountStatementPdfFileName(fileKey),
    );
  },

  /**
   * CSV del mismo documento: un renglón por factura y por viaje.
   * GET /finance/account-statement/csv?client_rfc= | client_id=
   */
  downloadAccountStatementCsv: async (
    target: AccountStatementTarget,
    options?: AccountStatementDownloadOptions,
  ): Promise<void> => {
    const { params, fileKey } = accountStatementRequest(target);
    if (options?.includeInvoices === false) {
      addOptionalParam(params, "include_invoices", "false");
    }
    if (options?.includeOperational === false) {
      addOptionalParam(params, "include_operational", "false");
    }
    await apiClient.downloadFile(
      `${FINANCE_BASE}/account-statement/csv?${params.toString()}`,
      buildAccountStatementCsvFileName(fileKey),
    );
  },

  /**
   * Conteo de facturas de ingreso timbradas con saldo al corte.
   * GET /finance/pending-relation?client_rfc=&format=count
   */
  getPendingRelationCount: async (
    clientRfc: string,
  ): Promise<PendingRelationCount> => {
    const rfc = clientRfc.trim().toUpperCase();
    const params = new URLSearchParams();
    addOptionalParam(params, "client_rfc", rfc);
    addOptionalParam(params, "format", "count");
    const response = await apiClient.get<{ data?: Record<string, unknown> }>(
      `${FINANCE_BASE}/pending-relation?${params.toString()}`,
    );
    return mapPendingRelationCount(response.data ?? {});
  },

  /**
   * PDF o CSV de la misma consulta. El navegador no arma el archivo.
   * GET /finance/pending-relation?client_rfc=&format=pdf|csv
   */
  downloadPendingRelation: async (
    clientRfc: string,
    format: PendingRelationFileFormat,
    generatedOn: string,
  ): Promise<void> => {
    const rfc = clientRfc.trim().toUpperCase();
    const params = new URLSearchParams();
    addOptionalParam(params, "client_rfc", rfc);
    addOptionalParam(params, "format", format);
    await apiClient.downloadFile(
      `${FINANCE_BASE}/pending-relation?${params.toString()}`,
      buildPendingRelationFileName(rfc, generatedOn, format),
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
    addOptionalParam(params, "vehicle_id", filters.vehicleId);
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

  getMonthlyPerformance: async (months: number): Promise<MonthlyPerformance> => {
    const params = new URLSearchParams();
    addOptionalParam(params, "months", months);

    const response = await apiClient.get<{
      data?: unknown;
      meta?: unknown;
    }>(`${FINANCE_BASE}/performance/monthly?${params.toString()}`);
    const payload = {
      ...((response.data ?? {}) as Record<string, unknown>),
      meta: response.meta,
    };
    return mapMonthlyPerformance(payload);
  },
};
