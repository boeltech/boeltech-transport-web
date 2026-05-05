import {
  apiClient,
  mapActionResponse,
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiActionResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type MappedPaginatedResult,
} from "@shared/api";
import type {
  AcceptInvitationResult,
  InvitationVerifyPayload,
  PendingInvitation,
} from "../domain/entities";

const BASE = "/invitations";

/**
 * API de invitaciones (crear, verificar, aceptar).
 * El cliente serializa bodies a snake_case.
 */
export const invitationsApi = {
  verify: async (token: string): Promise<InvitationVerifyPayload> => {
    const raw = await apiClient.get<ApiSingleResponse<Record<string, unknown>>>(
      `${BASE}/verify/${encodeURIComponent(token)}`,
    );
    const { data } = mapSingleResponse(raw);
    return data as unknown as InvitationVerifyPayload;
  },

  accept: async (input: {
    token: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
  }): Promise<{ message: string; data: AcceptInvitationResult }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ user_id: string; tenant_subdomain: string }>
    >(`${BASE}/accept`, {
      token: input.token,
      password: input.password,
      confirmPassword: input.confirmPassword,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    const { data, message } = mapSingleResponse(raw);
    return {
      message: message ?? "OK",
      data: {
        userId: data.userId,
        tenantSubdomain: data.tenantSubdomain,
      },
    };
  },

  create: async (input: {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{ message: string }> => {
    const raw = await apiClient.post<ApiSingleResponse<{ id: string }>>(`${BASE}/`, {
      email: input.email,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    const { message } = mapSingleResponse(raw);
    return { message: message ?? "Invitación enviada" };
  },

  listPending: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<MappedPaginatedResult<PendingInvitation>> => {
    type InvitationRowSnake = {
      id: string;
      email: string;
      role: string;
      expires_at: string;
      first_name: string | null;
      last_name: string | null;
      created_at: string;
      invited_by_user_id: string;
    };
    const raw = await apiClient.get<ApiPaginatedResponse<InvitationRowSnake>>(
      BASE,
      { params },
    );
    return mapPaginatedResponse(raw) as MappedPaginatedResult<PendingInvitation>;
  },

  resend: async (id: string): Promise<{ message: string }> => {
    const raw = await apiClient.post<ApiActionResponse>(
      `${BASE}/${encodeURIComponent(id)}/resend`,
    );
    return mapActionResponse(raw);
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    const raw = await apiClient.delete<ApiActionResponse>(
      `${BASE}/${encodeURIComponent(id)}`,
    );
    return mapActionResponse(raw);
  },
};
