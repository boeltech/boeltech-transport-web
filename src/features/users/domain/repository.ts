import type { UserRole } from "@shared/constants/roles";
import type { UserStatusType } from "./entities";

export interface CreateUserDTO {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly clientId?: string | null;
  readonly employeeId?: string | null;
}

export interface UpdateUserDTO {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: UserRole;
  readonly clientId?: string | null;
  readonly employeeId?: string | null;
  /** Reenvío tras el 409 `APPROVAL_POLICY_ORPHAN_GUARD` (ADR-0099 D12). */
  readonly confirmPolicyOrphan?: boolean;
}

export interface UpdateUserStatusDTO {
  readonly status: UserStatusType;
  readonly confirmPolicyOrphan?: boolean;
}
