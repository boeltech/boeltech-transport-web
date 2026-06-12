import { deepToCamel } from "@shared/api";
import type { MappedPaginatedResult, MappedSingleResult } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  ApprovableContext,
  ApprovableItem,
  BulkResult,
  PaginatedApprovals,
} from "../domain";

export interface ApiApprovableItemRaw {
  approvable_type: string;
  id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  submitted_at: string;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  context: Record<string, unknown>;
}

export interface ApiListApprovalsPaginationRaw {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

function mapContext(raw: Record<string, unknown>): ApprovableContext {
  const camel = deepToCamel(raw) as unknown as ApprovableContext;
  return camel;
}

export function mapApprovableItem(raw: ApiApprovableItemRaw): ApprovableItem {
  const base = deepToCamel({
    approvable_type: raw.approvable_type,
    id: raw.id,
    amount: raw.amount,
    currency: raw.currency,
    category: raw.category,
    status: raw.status,
    submitted_at: raw.submitted_at,
    submitted_by: raw.submitted_by,
    approved_at: raw.approved_at,
    approved_by: raw.approved_by,
    rejected_at: raw.rejected_at,
    rejection_reason: raw.rejection_reason,
  }) as Omit<ApprovableItem, "context">;

  return {
    ...base,
    currency: base.currency as ApprovableItem["currency"],
    status: base.status as ApprovableItem["status"],
    approvableType: base.approvableType as ApprovableItem["approvableType"],
    context: mapContext(raw.context),
  };
}

export function mapListApprovalsResponse(response: {
  data: ApiApprovableItemRaw[];
  pagination: ApiListApprovalsPaginationRaw;
}): MappedPaginatedResult<ApprovableItem> {
  return {
    data: response.data.map(mapApprovableItem),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.page_size,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}

export function mapSingleApprovableResponse(
  response: ApiSingleResponse<ApiApprovableItemRaw>,
): MappedSingleResult<ApprovableItem> {
  return {
    data: mapApprovableItem(response.data),
    ...(response.message ? { message: response.message } : {}),
  };
}

export function mapBulkResultResponse(raw: {
  successes: Array<{
    type: string;
    id: string;
    item: ApiApprovableItemRaw;
  }>;
  failures: Array<{
    type: string;
    id: string;
    error: { code: string; message: string };
  }>;
}): BulkResult {
  return {
    successes: raw.successes.map((success) => ({
      type: success.type as BulkResult["successes"][number]["type"],
      id: success.id,
      item: mapApprovableItem(success.item),
    })),
    failures: raw.failures.map((failure) => ({
      type: failure.type as BulkResult["failures"][number]["type"],
      id: failure.id,
      error: failure.error,
    })),
  };
}

export type { PaginatedApprovals };
