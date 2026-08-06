import type { UserRole } from "@shared/constants/roles";

export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export interface UserListItem {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: UserStatusType;
  readonly lastLogin: string | null;
  readonly createdAt: string;
}

/** Cupo de asientos del plan en el listado (`GET /users` → `meta`). */
export interface UserListMeta {
  readonly activeCount: number;
  readonly maxUsers: number | null;
  readonly limitReached: boolean;
  readonly overQuota: boolean;
  readonly overQuotaCount: number;
}

export interface User {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: UserStatusType;
  readonly lastLogin: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  /**
   * Auditoría: `created_by` y `updated_by` son self-FK contra `users(id)` con
   * trigger `users_self_attribute_audit_columns` que autorrellena con `id`
   * cuando el INSERT viene sin actor (registro inicial de tenant). NULL solo
   * si el actor fue eliminado.
   */
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  readonly createdByName: string | null;
  readonly updatedByName: string | null;
  readonly clientId: string | null;
  readonly employeeId: string | null;
  readonly driverId: string | null;
}

export interface UserFilters {
  readonly role?: UserRole;
  readonly status?: UserStatusType;
  readonly search?: string;
  /** YYYY-MM-DD (inicio del día UTC en API). */
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly lastLoginFrom?: string;
  readonly lastLoginTo?: string;
}

/** Evento de historial mínimo (gestión de usuarios). */
export interface UserManagementEvent {
  readonly id: string;
  readonly subjectUserId: string | null;
  readonly actorUserId: string | null;
  readonly actorEmail: string | null;
  readonly actorFirstName: string | null;
  readonly actorLastName: string | null;
  readonly action: string;
  readonly payload: Record<string, unknown>;
  readonly createdAt: string;
}

export interface UserSortOptions {
  readonly field:
    | "first_name"
    | "last_name"
    | "email"
    | "role"
    | "status"
    | "created_at"
    | "last_login";
  readonly direction: "asc" | "desc";
}

export interface UserQueryParams {
  readonly filters?: UserFilters;
  readonly sort?: UserSortOptions;
  readonly page?: number;
  readonly limit?: number;
}

export interface UserManagementActivityFilters {
  readonly action?: string;
  readonly actorUserId?: string;
  readonly subjectUserId?: string;
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly includeUnassigned?: boolean;
}

export const userQueryKeys = {
  all: ["users"] as const,
  lists: () => [...userQueryKeys.all, "list"] as const,
  list: (params?: UserQueryParams) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
  /** Invalida todas las queries de actividad de un usuario (cualquier página). */
  activityRoot: (userId: string) => [...userQueryKeys.all, "activity", userId] as const,
  activity: (userId: string, page?: number, limit?: number) =>
    [...userQueryKeys.activityRoot(userId), { page: page ?? 1, limit: limit ?? 25 }] as const,
  managementActivityRoot: () => [...userQueryKeys.all, "management-activity"] as const,
  managementActivity: (
    page: number,
    limit: number,
    filters?: UserManagementActivityFilters,
  ) =>
    [
      ...userQueryKeys.managementActivityRoot(),
      { page, limit, filters: filters ?? {} },
    ] as const,
};

export const USER_STATUS_LABELS: Record<UserStatusType, string> = {
  [UserStatus.ACTIVE]: "Activo",
  [UserStatus.INACTIVE]: "Inactivo",
  [UserStatus.SUSPENDED]: "Suspendido",
};
