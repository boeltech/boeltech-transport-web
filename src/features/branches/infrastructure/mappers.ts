import {
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedPaginatedResult,
  type MappedSingleResult,
} from "@shared/api";
import type { DeepCamelCase } from "@shared/api";
import type {
  Branch,
  BranchAddress,
  BranchListItem,
  BranchListMeta,
  BranchManagementEvent,
  BranchReconcilePreview,
  BranchReconcilePreviewBranch,
  BranchStatusType,
} from "../domain/entities";
import type { CreateBranchDTO, UpdateBranchDTO } from "../domain/repository";

export interface ApiBranchListMeta {
  active_count: number;
  max_branches: number | null;
  limit_reached: boolean;
  over_quota: boolean;
  over_quota_count: number;
  requires_remediation: boolean;
  plan_eligible_branch_ids: string[];
}

export interface ApiBranchListResponse extends ApiPaginatedResponse<ApiBranchListItemResponse> {
  meta?: ApiBranchListMeta;
}

export interface MappedBranchListResult {
  data: BranchListItem[];
  pagination: MappedPaginatedResult<BranchListItem>["pagination"];
  meta: BranchListMeta;
}

const DEFAULT_BRANCH_LIST_META: BranchListMeta = {
  activeCount: 0,
  maxBranches: null,
  limitReached: false,
  overQuota: false,
  overQuotaCount: 0,
  requiresRemediation: false,
  planEligibleBranchIds: [],
};

function mapBranchListMeta(meta?: ApiBranchListMeta): BranchListMeta {
  if (!meta) {
    return DEFAULT_BRANCH_LIST_META;
  }

  return {
    activeCount: meta.active_count,
    maxBranches: meta.max_branches,
    limitReached: meta.limit_reached,
    overQuota: meta.over_quota,
    overQuotaCount: meta.over_quota_count,
    requiresRemediation: meta.requires_remediation,
    planEligibleBranchIds: meta.plan_eligible_branch_ids ?? [],
  };
}

export interface ApiBranchListItemResponse {
  id: string;
  code: string;
  name: string;
  status: string;
  is_main: boolean;
  city: string;
  state: string;
  phone: string | null;
  is_active: boolean;
  is_plan_eligible?: boolean;
  created_at: string;
}

export interface ApiBranchAddressResponse {
  id: string;
  street: string;
  exterior_number: string | null;
  interior_number: string | null;
  neighborhood_name: string | null;
  reference: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string;
  sat_country_code: string;
  sat_state_code: string;
  sat_municipality_code: string | null;
  sat_locality_code: string | null;
  locality_name: string | null;
  sat_neighborhood_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geolocation_pending: boolean;
  location_name: string | null;
}

export interface ApiBranchResponse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  status: string;
  is_main: boolean;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
  address: ApiBranchAddressResponse;
}

function mapBranchListItem(raw: DeepCamelCase<ApiBranchListItemResponse>): BranchListItem {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    status: raw.status as BranchStatusType,
    isMain: raw.isMain,
    city: raw.city,
    state: raw.state,
    phone: raw.phone,
    isActive: raw.isActive,
    isPlanEligible: raw.isPlanEligible,
    createdAt: new Date(raw.createdAt),
  };
}

function mapBranchAddress(
  raw: DeepCamelCase<ApiBranchAddressResponse>,
): BranchAddress {
  return {
    addressId: raw.id,
    street: raw.street,
    exteriorNumber: raw.exteriorNumber,
    interiorNumber: raw.interiorNumber,
    neighborhood: raw.neighborhoodName,
    city: raw.city ?? "",
    state: raw.state ?? "",
    postalCode: raw.postalCode,
    country: raw.country,
    satCountryCode: raw.satCountryCode,
    satStateCode: raw.satStateCode,
    satMunicipalityCode: raw.satMunicipalityCode,
    satLocalityCode: raw.satLocalityCode,
    localityName: raw.localityName,
    satNeighborhoodCode: raw.satNeighborhoodCode,
    latitude: raw.latitude,
    longitude: raw.longitude,
    geolocationPending: raw.geolocationPending,
    locationName: raw.locationName,
  };
}

function mapBranch(raw: DeepCamelCase<ApiBranchResponse>): Branch {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    code: raw.code,
    name: raw.name,
    status: raw.status as BranchStatusType,
    isMain: raw.isMain,
    isActive: raw.isActive,
    address: mapBranchAddress(raw.address),
    contact: {
      phone: raw.phone,
      email: raw.email,
      managerName: raw.managerName,
    },
    notes: raw.notes,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
    createdByName: raw.createdByName ?? null,
    updatedByName: raw.updatedByName ?? null,
  };
}

export function mapPaginatedBranches(
  response: ApiBranchListResponse,
): MappedBranchListResult {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data.map(mapBranchListItem),
    pagination: mapped.pagination,
    meta: mapBranchListMeta(response.meta),
  };
}

export function mapSingleBranch(
  response: ApiSingleResponse<ApiBranchResponse>,
): MappedSingleResult<Branch> {
  const mapped = mapSingleResponse(response);
  return {
    data: mapBranch(mapped.data),
    message: mapped.message,
  };
}

function mapAddressInputToApi(
  address: CreateBranchDTO["address"] | NonNullable<UpdateBranchDTO["address"]>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (address.street !== undefined) payload.street = address.street;
  if (address.exterior_number !== undefined) {
    payload.exterior_number = address.exterior_number;
  }
  if (address.interior_number !== undefined) {
    payload.interior_number = address.interior_number;
  }
  if (address.neighborhood_name !== undefined) {
    payload.neighborhood_name = address.neighborhood_name;
  }
  if (address.reference !== undefined) payload.reference = address.reference;
  if (address.postal_code !== undefined) payload.postal_code = address.postal_code;
  if (address.sat_country_code !== undefined) {
    payload.sat_country_code = address.sat_country_code;
  }
  if (address.sat_state_code !== undefined) {
    payload.sat_state_code = address.sat_state_code;
  }
  if (address.sat_municipality_code !== undefined) {
    payload.sat_municipality_code = address.sat_municipality_code;
  }
  if (address.sat_locality_code !== undefined) {
    payload.sat_locality_code = address.sat_locality_code;
  }
  if (address.locality_name !== undefined) payload.locality_name = address.locality_name;
  if (address.sat_neighborhood_code !== undefined) {
    payload.sat_neighborhood_code = address.sat_neighborhood_code;
  }
  if (address.latitude !== undefined) payload.latitude = address.latitude;
  if (address.longitude !== undefined) payload.longitude = address.longitude;
  if (address.geocoding_source !== undefined) {
    payload.geocoding_source = address.geocoding_source;
  }
  if (address.location_name !== undefined) payload.location_name = address.location_name;
  return payload;
}

export function toApiCreateBranch(dto: CreateBranchDTO): Record<string, unknown> {
  return {
    code: dto.code,
    name: dto.name,
    status: dto.status,
    is_main: dto.isMain,
    phone: dto.phone,
    email: dto.email,
    manager_name: dto.managerName,
    notes: dto.notes,
    address: mapAddressInputToApi(dto.address),
  };
}

export function toApiUpdateBranch(dto: UpdateBranchDTO): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.status !== undefined) payload.status = dto.status;
  if (dto.isMain !== undefined) payload.is_main = dto.isMain;
  if (dto.isActive !== undefined) payload.is_active = dto.isActive;
  if (dto.phone !== undefined) payload.phone = dto.phone;
  if (dto.email !== undefined) payload.email = dto.email;
  if (dto.managerName !== undefined) payload.manager_name = dto.managerName;
  if (dto.notes !== undefined) payload.notes = dto.notes;
  if (dto.address !== undefined) payload.address = mapAddressInputToApi(dto.address);
  return payload;
}

export interface ApiBranchManagementEventResponse {
  id: string;
  branch_id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export const mapPaginatedBranchActivity = (
  response: ApiPaginatedResponse<ApiBranchManagementEventResponse>,
): MappedPaginatedResult<BranchManagementEvent> => mapPaginatedResponse(response);

export interface ApiBranchReconcilePreviewBranch {
  id: string;
  code: string;
  name: string;
  is_main: boolean;
  employee_count: number;
  is_plan_eligible: boolean;
  preselected: boolean;
}

export interface ApiBranchReconcilePreview {
  capacity: ApiBranchListMeta;
  branches: ApiBranchReconcilePreviewBranch[];
}

function mapReconcilePreviewBranch(
  raw: DeepCamelCase<ApiBranchReconcilePreviewBranch>,
): BranchReconcilePreviewBranch {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    isMain: raw.isMain,
    employeeCount: raw.employeeCount,
    isPlanEligible: raw.isPlanEligible,
    preselected: raw.preselected,
  };
}

export function mapBranchReconcilePreview(
  response: ApiSingleResponse<ApiBranchReconcilePreview>,
): MappedSingleResult<BranchReconcilePreview> {
  const mapped = mapSingleResponse(response);

  return {
    data: {
      capacity: mapBranchListMeta(response.data.capacity),
      branches: mapped.data.branches.map(mapReconcilePreviewBranch),
    },
    message: mapped.message,
  };
}

export function mapBranchCapacityMeta(
  response: ApiSingleResponse<ApiBranchListMeta>,
): MappedSingleResult<BranchListMeta> {
  const mapped = mapSingleResponse(response);

  return {
    data: mapBranchListMeta(response.data),
    message: mapped.message,
  };
}
