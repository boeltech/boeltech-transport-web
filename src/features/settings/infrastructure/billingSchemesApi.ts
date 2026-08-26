import {
  apiClient,
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type DeepCamelCase,
} from "@shared/api";
import type {
  BillingScheme,
  BillingSchemeParams,
  CreateBillingSchemePayload,
  UpdateBillingSchemePayload,
} from "../domain/billingScheme.types";

const BASE = "/billing-schemes";

type ApiBillingSchemeRaw = {
  id: string;
  tenant_id: string;
  name: string;
  cadence_kind: string;
  params: Record<string, unknown>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapParams(raw: Record<string, unknown>): BillingSchemeParams {
  if ("window_hours" in raw) {
    return { windowHours: Number(raw.window_hours) };
  }
  if ("weekdays" in raw && Array.isArray(raw.weekdays)) {
    return { weekdays: raw.weekdays.map(Number) };
  }
  if ("business_days_from_month_start" in raw) {
    return {
      businessDaysFromMonthStart: Number(raw.business_days_from_month_start),
    };
  }
  if ("month_days" in raw && Array.isArray(raw.month_days)) {
    return { monthDays: raw.month_days.map(Number) };
  }
  return { windowHours: 48 };
}

function mapScheme(raw: DeepCamelCase<ApiBillingSchemeRaw>): BillingScheme {
  const paramsRaw =
    raw.params && typeof raw.params === "object"
      ? (raw.params as Record<string, unknown>)
      : {};
  const snakeParams: Record<string, unknown> = {};
  if ("windowHours" in paramsRaw) snakeParams.window_hours = paramsRaw.windowHours;
  if ("weekdays" in paramsRaw) snakeParams.weekdays = paramsRaw.weekdays;
  if ("monthDays" in paramsRaw) snakeParams.month_days = paramsRaw.monthDays;
  if ("businessDaysFromMonthStart" in paramsRaw) {
    snakeParams.business_days_from_month_start =
      paramsRaw.businessDaysFromMonthStart;
  }
  const fromApi =
    Object.keys(snakeParams).length > 0
      ? snakeParams
      : (paramsRaw as Record<string, unknown>);

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.name,
    cadenceKind: raw.cadenceKind as BillingScheme["cadenceKind"],
    params: mapParams(fromApi),
    isDefault: raw.isDefault,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function paramsToApi(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ("windowHours" in params) out.window_hours = params.windowHours;
  if ("weekdays" in params) out.weekdays = params.weekdays;
  if ("monthDays" in params) out.month_days = params.monthDays;
  if ("businessDaysFromMonthStart" in params) {
    out.business_days_from_month_start = params.businessDaysFromMonthStart;
  }
  if (Object.keys(out).length === 0) return params;
  return out;
}

function toApiPayload(
  payload: CreateBillingSchemePayload | UpdateBillingSchemePayload,
) {
  return {
    name: payload.name,
    cadence_kind: payload.cadenceKind,
    params: payload.params ? paramsToApi(payload.params) : undefined,
    is_default: payload.isDefault,
  };
}

export async function fetchBillingSchemes(params?: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<BillingScheme[]> {
  const response = await apiClient.get<
    ApiPaginatedResponse<ApiBillingSchemeRaw>
  >(BASE, {
    params: {
      is_active: params?.isActive,
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
    },
  });
  const { data } = mapPaginatedResponse(response);
  return data.map((row) =>
    mapScheme(row as unknown as DeepCamelCase<ApiBillingSchemeRaw>),
  );
}

export async function fetchBillingSchemeById(id: string): Promise<BillingScheme> {
  const response = await apiClient.get<ApiSingleResponse<ApiBillingSchemeRaw>>(
    `${BASE}/${id}`,
  );
  const { data } = mapSingleResponse(response);
  return mapScheme(data as unknown as DeepCamelCase<ApiBillingSchemeRaw>);
}

export async function createBillingScheme(
  payload: CreateBillingSchemePayload,
): Promise<BillingScheme> {
  const response = await apiClient.post<ApiSingleResponse<ApiBillingSchemeRaw>>(
    BASE,
    toApiPayload(payload),
  );
  const { data } = mapSingleResponse(response);
  return mapScheme(data as unknown as DeepCamelCase<ApiBillingSchemeRaw>);
}

export async function updateBillingScheme(
  id: string,
  payload: UpdateBillingSchemePayload,
): Promise<BillingScheme> {
  const response = await apiClient.patch<
    ApiSingleResponse<ApiBillingSchemeRaw>
  >(`${BASE}/${id}`, toApiPayload(payload));
  const { data } = mapSingleResponse(response);
  return mapScheme(data as unknown as DeepCamelCase<ApiBillingSchemeRaw>);
}

export async function deleteBillingScheme(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
