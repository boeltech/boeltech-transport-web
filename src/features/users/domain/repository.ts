import type { UserRole } from "@shared/constants/roles";
import type { UserStatusType } from "./entities";

export interface CreateUserDTO {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
}

export interface UpdateUserDTO {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: UserRole;
}

export interface UpdateUserStatusDTO {
  readonly status: UserStatusType;
}
