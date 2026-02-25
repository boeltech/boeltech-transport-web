/**
 * Expense Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma datos entre API (snake_case) y dominio (camelCase).
 */

import type {
  TripExpense,
  ExpenseCategoryType,
  ExpenseStatusType,
} from "@features/trips/domain/entities";
import type {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpensesSummary,
} from "@features/trips/domain";
import type { MappedSingleResult } from "@shared/api";

// ============================================================================
// API RESPONSE TYPES (snake_case)
// ============================================================================

export interface ApiExpenseResponse {
  id: string;
  tenant_id: string;
  trip_id: string;
  category: ExpenseCategoryType;
  subcategory: string | null;
  sat_catalog_key: string | null;
  description: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  expense_date: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  has_receipt: boolean;
  receipt_url: string | null;
  receipt_number: string | null;
  receipt_uuid: string | null;
  vendor_name: string | null;
  vendor_rfc: string | null;
  status: ExpenseStatusType;
  is_estimated: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ApiExpensesSummaryResponse {
  total: number;
  by_category: Record<string, number>;
  estimated_count: number;
  pending_count: number;
}

// ============================================================================
// API → DOMAIN MAPPERS
// ============================================================================

/**
 * Mapea gasto de API a dominio
 */
export function mapApiExpense(api: ApiExpenseResponse): TripExpense {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    tripId: api.trip_id,
    category: api.category,
    subcategory: api.subcategory,
    satCatalogKey: api.sat_catalog_key,
    description: api.description,
    amount: api.amount,
    currency: api.currency,
    exchangeRate: api.exchange_rate,
    expenseDate: new Date(api.expense_date),
    location: api.location,
    latitude: api.latitude,
    longitude: api.longitude,
    hasReceipt: api.has_receipt,
    receiptUrl: api.receipt_url,
    receiptNumber: api.receipt_number,
    receiptUuid: api.receipt_uuid,
    vendorName: api.vendor_name,
    vendorRfc: api.vendor_rfc,
    status: api.status,
    isEstimated: api.is_estimated,
    approvedBy: api.approved_by,
    approvedAt: api.approved_at ? new Date(api.approved_at) : null,
    rejectionReason: api.rejection_reason,
    notes: api.notes,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
  };
}

/**
 * Mapea resumen de gastos de API a dominio
 */
export function mapApiExpensesSummary(
  api: ApiExpensesSummaryResponse,
): ExpensesSummary {
  return {
    total: api.total,
    byCategory: api.by_category,
    estimatedCount: api.estimated_count,
    pendingCount: api.pending_count,
  };
}

// ============================================================================
// RESPONSE MAPPERS (con mensaje)
// ============================================================================

/**
 * Mapea respuesta de API con array de gastos
 */
export function mapExpensesResponse(response: {
  data: ApiExpenseResponse[];
  message?: string;
}): MappedSingleResult<TripExpense[]> {
  return {
    data: response.data.map(mapApiExpense),
    message: response.message,
  };
}

/**
 * Mapea respuesta de API con un gasto
 */
export function mapExpenseResponse(response: {
  data: ApiExpenseResponse;
  message?: string;
}): MappedSingleResult<TripExpense> {
  return {
    data: mapApiExpense(response.data),
    message: response.message,
  };
}

/**
 * Mapea respuesta de resumen de gastos
 */
export function mapExpensesSummaryResponse(response: {
  data: ApiExpensesSummaryResponse;
  message?: string;
}): MappedSingleResult<ExpensesSummary> {
  return {
    data: mapApiExpensesSummary(response.data),
    message: response.message,
  };
}

// ============================================================================
// DOMAIN → API MAPPERS (camelCase → snake_case)
// ============================================================================

/**
 * Convierte DTO de crear gasto a formato API
 */
export function toApiCreateExpense(
  dto: CreateExpenseDTO,
): Record<string, unknown> {
  return {
    category: dto.category,
    description: dto.description,
    amount: dto.amount,
    currency: dto.currency ?? "MXN",
    expense_date: dto.expenseDate,
    location: dto.location,
    has_receipt: dto.hasReceipt ?? false,
    receipt_url: dto.receiptUrl,
    vendor_name: dto.vendorName,
    is_estimated: dto.isEstimated ?? false,
    notes: dto.notes,
  };
}

/**
 * Convierte DTO de actualizar gasto a formato API
 */
export function toApiUpdateExpense(
  dto: UpdateExpenseDTO,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.category !== undefined) result.category = dto.category;
  if (dto.description !== undefined) result.description = dto.description;
  if (dto.amount !== undefined) result.amount = dto.amount;
  if (dto.currency !== undefined) result.currency = dto.currency;
  if (dto.expenseDate !== undefined) result.expense_date = dto.expenseDate;
  if (dto.location !== undefined) result.location = dto.location;
  if (dto.hasReceipt !== undefined) result.has_receipt = dto.hasReceipt;
  if (dto.receiptUrl !== undefined) result.receipt_url = dto.receiptUrl;
  if (dto.vendorName !== undefined) result.vendor_name = dto.vendorName;
  if (dto.isEstimated !== undefined) result.is_estimated = dto.isEstimated;
  if (dto.status !== undefined) result.status = dto.status;
  if (dto.notes !== undefined) result.notes = dto.notes;

  return result;
}
