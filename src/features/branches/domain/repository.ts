import type { BranchStatusType } from "./entities";

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
