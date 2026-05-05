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
  BranchListItem,
  BranchStatusType,
} from "../domain/entities";
import type { CreateBranchDTO, UpdateBranchDTO } from "../domain/repository";

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
  created_at: string;
}

export interface ApiBranchResponse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  status: string;
  is_main: boolean;
  is_active: boolean;
  street: string;
  exterior_number: string | null;
  interior_number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
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
    createdAt: new Date(raw.createdAt),
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
    address: {
      street: raw.street,
      exteriorNumber: raw.exteriorNumber,
      interiorNumber: raw.interiorNumber,
      neighborhood: raw.neighborhood,
      city: raw.city,
      state: raw.state,
      postalCode: raw.postalCode,
      country: raw.country,
    },
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
  };
}

export function mapPaginatedBranches(
  response: ApiPaginatedResponse<ApiBranchListItemResponse>,
): MappedPaginatedResult<BranchListItem> {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data.map(mapBranchListItem),
    pagination: mapped.pagination,
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

export function toApiCreateBranch(dto: CreateBranchDTO): Record<string, unknown> {
  return {
    code: dto.code,
    name: dto.name,
    status: dto.status,
    is_main: dto.isMain,
    street: dto.street,
    exterior_number: dto.exteriorNumber,
    interior_number: dto.interiorNumber,
    neighborhood: dto.neighborhood,
    city: dto.city,
    state: dto.state,
    postal_code: dto.postalCode,
    country: dto.country,
    phone: dto.phone,
    email: dto.email,
    manager_name: dto.managerName,
    notes: dto.notes,
  };
}

export function toApiUpdateBranch(dto: UpdateBranchDTO): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.status !== undefined) payload.status = dto.status;
  if (dto.isMain !== undefined) payload.is_main = dto.isMain;
  if (dto.isActive !== undefined) payload.is_active = dto.isActive;
  if (dto.street !== undefined) payload.street = dto.street;
  if (dto.exteriorNumber !== undefined) payload.exterior_number = dto.exteriorNumber;
  if (dto.interiorNumber !== undefined) payload.interior_number = dto.interiorNumber;
  if (dto.neighborhood !== undefined) payload.neighborhood = dto.neighborhood;
  if (dto.city !== undefined) payload.city = dto.city;
  if (dto.state !== undefined) payload.state = dto.state;
  if (dto.postalCode !== undefined) payload.postal_code = dto.postalCode;
  if (dto.country !== undefined) payload.country = dto.country;
  if (dto.phone !== undefined) payload.phone = dto.phone;
  if (dto.email !== undefined) payload.email = dto.email;
  if (dto.managerName !== undefined) payload.manager_name = dto.managerName;
  if (dto.notes !== undefined) payload.notes = dto.notes;
  return payload;
}
