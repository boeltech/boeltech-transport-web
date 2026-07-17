import type { BranchStatusType } from "./entities";

export interface BranchAddressInput {
  street?: string;
  exterior_number?: string;
  interior_number?: string | null;
  neighborhood_name?: string | null;
  reference?: string | null;
  postal_code?: string;
  sat_country_code?: string;
  sat_state_code?: string;
  sat_municipality_code?: string | null;
  sat_locality_code?: string | null;
  locality_name?: string | null;
  sat_neighborhood_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocoding_source?: "manual" | "google" | "sepomex" | null;
  location_name?: string | null;
}

export interface CreateBranchDTO {
  code: string;
  name: string;
  status: BranchStatusType;
  isMain?: boolean;
  phone?: string;
  email?: string;
  managerName?: string;
  notes?: string;
  address: BranchAddressInput;
}

export interface UpdateBranchDTO {
  name?: string;
  status?: BranchStatusType;
  isMain?: boolean;
  isActive?: boolean;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  notes?: string | null;
  address?: BranchAddressInput;
}
