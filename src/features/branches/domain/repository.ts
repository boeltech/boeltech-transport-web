import type {
  MappedActionResult,
  MappedPaginatedResult,
  MappedSingleResult,
} from "@shared/api";
import type { Branch, BranchListItem, BranchQueryParams, BranchStatusType } from "./entities";

export interface CreateBranchDTO {
  code: string;
  name: string;
  status: BranchStatusType;
  isMain?: boolean;
  street: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  notes?: string;
}

export interface UpdateBranchDTO {
  name?: string;
  status?: BranchStatusType;
  isMain?: boolean;
  isActive?: boolean;
  street?: string;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  notes?: string | null;
}

export interface IBranchRepository {
  findAll(params?: BranchQueryParams): Promise<MappedPaginatedResult<BranchListItem>>;
  findById(id: string): Promise<MappedSingleResult<Branch | null>>;
  create(data: CreateBranchDTO): Promise<MappedSingleResult<Branch>>;
  update(id: string, data: UpdateBranchDTO): Promise<MappedSingleResult<Branch>>;
  delete(id: string): Promise<MappedActionResult>;
}
