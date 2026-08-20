/**
 * Trailer API types (snake_case) + mappers → domain camelCase.
 */

import type { MappedPaginatedResult } from "@shared/api";
import type { Trailer, TrailerListItem, TrailerStatusType } from "../domain";

export interface ApiTrailerResponse {
  id: string;
  tenant_id: string;
  license_plate: string;
  sat_sub_tipo_rem_code: string;
  status: string;
  branch_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type ApiTrailerListItemResponse = ApiTrailerResponse;

export function mapTrailerListItem(
  raw: ApiTrailerListItemResponse,
): TrailerListItem {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    licensePlate: raw.license_plate,
    satSubTipoRemCode: raw.sat_sub_tipo_rem_code,
    status: raw.status as TrailerStatusType,
    branchId: raw.branch_id,
    isActive: raw.is_active,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    createdBy: raw.created_by,
    updatedBy: raw.updated_by,
  };
}

export function mapTrailerDetail(raw: ApiTrailerResponse): Trailer {
  return mapTrailerListItem(raw);
}

/**
 * Paginación del listado. El contrato estándar es `total_pages` (como vehículos
 * y conductores). GET /trailers hoy envía `totalPages` en camelCase; leemos ambos
 * para que ListingPagination pueda ocultarse cuando hay una sola página.
 */
export interface ApiTrailerListPagination {
  page: number;
  limit: number;
  total: number;
  total_pages?: number;
  totalPages?: number;
}

export function mapTrailerList(raw: {
  data?: ApiTrailerListItemResponse[];
  pagination: ApiTrailerListPagination;
}): MappedPaginatedResult<TrailerListItem> {
  const { page, limit, total } = raw.pagination;
  const totalPages =
    raw.pagination.total_pages ??
    raw.pagination.totalPages ??
    Math.max(1, Math.ceil((total || 0) / (limit || 1)));

  return {
    data: (raw.data ?? []).map(mapTrailerListItem),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
