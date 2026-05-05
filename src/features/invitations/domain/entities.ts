import type { UserRole } from "@shared/constants/roles";

/** Respuesta pública de GET /invitations/verify/:token (tras mapSingleResponse / camelCase). */
export interface InvitationVerifyPayload {
  valid: boolean;
  error?: string;
  email?: string;
  role?: UserRole;
  expiresAt?: string;
  tenantName?: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AcceptInvitationResult {
  userId: string;
  tenantSubdomain: string;
}

/** Invitación pendiente (GET /invitations, mapPaginatedResponse). */
export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  invitedByUserId: string;
}
