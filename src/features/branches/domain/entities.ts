export const BranchStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type BranchStatusType = (typeof BranchStatus)[keyof typeof BranchStatus];

export interface BranchAddress {
  readonly street: string;
  readonly exteriorNumber: string | null;
  readonly interiorNumber: string | null;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface BranchContact {
  readonly phone: string | null;
  readonly email: string | null;
  readonly managerName: string | null;
}

export interface BranchListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: BranchStatusType;
  readonly isMain: boolean;
  readonly city: string;
  readonly state: string;
  readonly phone: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface Branch {
  readonly id: string;
  readonly tenantId: string;
  readonly code: string;
  readonly name: string;
  readonly status: BranchStatusType;
  readonly isMain: boolean;
  readonly isActive: boolean;
  readonly address: BranchAddress;
  readonly contact: BranchContact;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  /** Nombre completo del usuario creador (LEFT JOIN users). */
  readonly createdByName: string | null;
  /** Nombre completo del usuario que realizó la última actualización. */
  readonly updatedByName: string | null;
}

export interface BranchFilters {
  readonly status?: BranchStatusType;
  readonly isMain?: boolean;
  readonly isActive?: boolean;
  readonly search?: string;
}

export interface BranchSortOptions {
  readonly field: "code" | "name" | "city" | "status" | "created_at";
  readonly direction: "asc" | "desc";
}

export interface BranchQueryParams {
  readonly filters?: BranchFilters;
  readonly sort?: BranchSortOptions;
  readonly page?: number;
  readonly limit?: number;
}

export const branchQueryKeys = {
  all: ["branches"] as const,
  lists: () => [...branchQueryKeys.all, "list"] as const,
  list: (params?: BranchQueryParams) =>
    [...branchQueryKeys.lists(), params] as const,
  details: () => [...branchQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...branchQueryKeys.details(), id] as const,
};

export const BRANCH_STATUS_LABELS: Record<BranchStatusType, string> = {
  [BranchStatus.ACTIVE]: "Activa",
  [BranchStatus.INACTIVE]: "Inactiva",
};
