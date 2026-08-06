export const BranchStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type BranchStatusType = (typeof BranchStatus)[keyof typeof BranchStatus];

export interface BranchAddress {
  readonly addressId?: string;
  readonly street: string;
  readonly exteriorNumber: string | null;
  readonly interiorNumber: string | null;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
  readonly satCountryCode?: string;
  readonly satStateCode?: string;
  readonly satMunicipalityCode?: string | null;
  readonly satLocalityCode?: string | null;
  readonly localityName?: string | null;
  readonly satNeighborhoodCode?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly geolocationPending?: boolean;
  readonly locationName?: string | null;
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
  readonly isPlanEligible?: boolean;
  readonly createdAt: Date;
}

export interface BranchListMeta {
  readonly activeCount: number;
  readonly maxBranches: number | null;
  readonly limitReached: boolean;
  readonly overQuota: boolean;
  readonly overQuotaCount: number;
  readonly requiresRemediation: boolean;
  readonly planEligibleBranchIds: string[];
}

export interface BranchEmployeeReassignment {
  readonly fromBranchId: string;
  readonly toBranchId: string;
}

export interface BranchReconcilePreviewBranch {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly isMain: boolean;
  readonly employeeCount: number;
  readonly isPlanEligible: boolean;
  readonly preselected: boolean;
}

export interface BranchReconcilePreview {
  readonly capacity: BranchListMeta;
  readonly branches: BranchReconcilePreviewBranch[];
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
  /** YYYY-MM-DD (inicio del día UTC en API). */
  readonly createdFrom?: string;
  readonly createdTo?: string;
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
  activityRoot: (branchId: string) =>
    [...branchQueryKeys.all, "activity", branchId] as const,
  activity: (branchId: string, page?: number, limit?: number) =>
    [...branchQueryKeys.activityRoot(branchId), { page: page ?? 1, limit: limit ?? 25 }] as const,
  reconcilePreview: () => [...branchQueryKeys.all, "reconcile-preview"] as const,
};

/** Evento de historial mínimo (gestión de sucursales). */
export interface BranchManagementEvent {
  readonly id: string;
  readonly branchId: string;
  readonly actorUserId: string | null;
  readonly actorEmail: string | null;
  readonly actorFirstName: string | null;
  readonly actorLastName: string | null;
  readonly action: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
}

export const BRANCH_STATUS_LABELS: Record<BranchStatusType, string> = {
  [BranchStatus.ACTIVE]: "Activa",
  [BranchStatus.INACTIVE]: "Inactiva",
};
