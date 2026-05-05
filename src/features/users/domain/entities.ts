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
  readonly subjectUserId: string;
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
};

export const USER_STATUS_LABELS: Record<UserStatusType, string> = {
  [UserStatus.ACTIVE]: "Activo",
  [UserStatus.INACTIVE]: "Inactivo",
  [UserStatus.SUSPENDED]: "Suspendido",
};
