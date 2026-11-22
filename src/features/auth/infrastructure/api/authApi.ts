/**
 * Auth API
 * Clean Architecture - Infrastructure Layer
 *
 * Llamadas HTTP al backend de autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/api/authApi.ts
 */

import {
  apiClient,
  mapSingleResponse,
  type ApiSingleResponse,
} from "@/shared/api";
import type {
  ApiEnvelope,
  AuthResponse,
  AuthSessionItem,
  ChangePasswordPayload,
  ChangePasswordResult,
  LoginApiPayload,
  LoginApiData,
  LoginResult,
  MfaSetupResult,
  MfaStatus,
  RefreshApiData,
  RefreshResponse,
  EmailChangePendingResult,
  RequestEmailChangePayload,
  UpdateMyProfilePayload,
  UpdateProfileResult,
  UserApi,
  UserJSON,
} from "../../domain";
import { tokenStorage } from "../storage/tokenStorage";

const mapUserApiToJson = (user: UserApi): UserJSON => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
  tenant: user.tenant,
  lastLogin: user.last_login,
  permissions: user.permissions,
  onboardingCompletedAt:
    user.onboarding_completed_at !== undefined
      ? user.onboarding_completed_at
      : undefined,
  emailVerifiedAt:
    user.email_verified_at !== undefined ? user.email_verified_at : undefined,
  pendingEmail:
    user.pending_email !== undefined ? user.pending_email : undefined,
  pendingEmailExpiresAt:
    user.pending_email_expires_at !== undefined
      ? user.pending_email_expires_at
      : undefined,
});

type UserCamelPartial = {
  id: string;
  email: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  role: UserJSON["role"];
  tenant: UserJSON["tenant"];
  lastLogin?: string;
  last_login?: string;
  permissions?: string[];
  onboardingCompletedAt?: string | null;
  onboarding_completed_at?: string | null;
  emailVerifiedAt?: string | null;
  email_verified_at?: string | null;
  pendingEmail?: string | null;
  pending_email?: string | null;
  pendingEmailExpiresAt?: string | null;
  pending_email_expires_at?: string | null;
};

const mapUserCamelToJson = (data: UserCamelPartial): UserJSON => ({
  id: data.id,
  email: data.email,
  firstName: data.firstName ?? data.first_name!,
  lastName: data.lastName ?? data.last_name!,
  role: data.role,
  tenant: data.tenant,
  lastLogin: data.lastLogin ?? data.last_login,
  permissions: data.permissions,
  onboardingCompletedAt:
    data.onboardingCompletedAt !== undefined
      ? data.onboardingCompletedAt
      : data.onboarding_completed_at,
  emailVerifiedAt:
    data.emailVerifiedAt !== undefined
      ? data.emailVerifiedAt
      : data.email_verified_at,
  pendingEmail:
    data.pendingEmail !== undefined ? data.pendingEmail : data.pending_email,
  pendingEmailExpiresAt:
    data.pendingEmailExpiresAt !== undefined
      ? data.pendingEmailExpiresAt
      : data.pending_email_expires_at,
});

const mapEmailChangePending = (data: {
  pendingEmail?: string;
  pending_email?: string;
  expiresAt?: string;
  expires_at?: string;
}): EmailChangePendingResult => ({
  pendingEmail: data.pendingEmail ?? data.pending_email!,
  expiresAt: data.expiresAt ?? data.expires_at!,
});

function mapLoginPayload(data: LoginApiPayload): LoginResult {
  if ("needs_mfa" in data && data.needs_mfa === true) {
    return {
      needsMfa: true,
      mfaChallengeToken: data.mfa_challenge_token,
      mfaChallengeExpiresAt: data.mfa_challenge_expires_at,
    };
  }
  const session = data as LoginApiData;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: mapUserApiToJson(session.user),
  };
}

/**
 * API de Autenticación
 */
export const authApi = {
  login: async (credentials: {
    email: string;
    password: string;
    subdomain: string;
    captchaToken?: string;
  }): Promise<LoginResult> => {
    const response = await apiClient.post<ApiEnvelope<LoginApiPayload>>(
      "/auth/login",
      credentials,
    );
    return mapLoginPayload(response.data);
  },

  verifyMfaLogin: async (payload: {
    mfaChallengeToken: string;
    code: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiEnvelope<LoginApiPayload>>(
      "/auth/mfa/verify",
      payload,
    );
    const mapped = mapLoginPayload(response.data);
    if ("needsMfa" in mapped) {
      throw new Error("Respuesta MFA inesperada");
    }
    return mapped;
  },

  getMfaStatus: async (): Promise<MfaStatus> => {
    const raw = await apiClient.get<
      ApiSingleResponse<{ enabled: boolean; enabled_at: string | null }>
    >("/auth/mfa/status");
    const { data } = mapSingleResponse(raw);
    return {
      enabled: Boolean(data.enabled),
      enabledAt:
        (data as { enabledAt?: string | null }).enabledAt ??
        (data as { enabled_at?: string | null }).enabled_at ??
        null,
    };
  },

  setupMfa: async (): Promise<MfaSetupResult> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ otpauth_url: string; secret: string }>
    >("/auth/mfa/setup");
    const { data } = mapSingleResponse(raw);
    return {
      otpauthUrl:
        (data as { otpauthUrl?: string }).otpauthUrl ??
        (data as { otpauth_url?: string }).otpauth_url!,
      secret: data.secret,
    };
  },

  confirmMfa: async (code: string): Promise<{ recoveryCodes: string[] }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ recovery_codes: string[] }>
    >("/auth/mfa/confirm", { code });
    const { data } = mapSingleResponse(raw);
    const codes =
      (data as { recoveryCodes?: string[] }).recoveryCodes ??
      (data as { recovery_codes?: string[] }).recovery_codes ??
      [];
    return { recoveryCodes: codes };
  },

  disableMfa: async (payload: {
    password: string;
    code: string;
  }): Promise<void> => {
    await apiClient.post("/auth/mfa/disable", payload);
  },

  listSessions: async (): Promise<AuthSessionItem[]> => {
    const refreshToken = tokenStorage.getRefreshToken();
    const raw = await apiClient.get<
      ApiSingleResponse<
        Array<{
          id: string;
          created_at: string;
          last_used_at: string | null;
          expires_at: string;
          user_agent: string | null;
          ip: string | null;
          label: string | null;
          current: boolean;
        }>
      >
    >(
      "/auth/sessions",
      refreshToken
        ? { headers: { "X-Refresh-Token": refreshToken } }
        : undefined,
    );
    const { data } = mapSingleResponse(raw);
    return (data as AuthSessionItem[]).map((s) => ({
      id: s.id,
      createdAt:
        (s as { createdAt?: string }).createdAt ??
        (s as { created_at?: string }).created_at!,
      lastUsedAt:
        (s as { lastUsedAt?: string | null }).lastUsedAt ??
        (s as { last_used_at?: string | null }).last_used_at ??
        null,
      expiresAt:
        (s as { expiresAt?: string }).expiresAt ??
        (s as { expires_at?: string }).expires_at!,
      userAgent:
        (s as { userAgent?: string | null }).userAgent ??
        (s as { user_agent?: string | null }).user_agent ??
        null,
      ip: s.ip ?? null,
      label: s.label ?? null,
      current: Boolean(s.current),
    }));
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  /** POST /auth/sessions/revoke-others — preparado para F3. */
  revokeOtherSessions: async (): Promise<{ revoked: number }> => {
    const refreshToken = tokenStorage.getRefreshToken();
    const raw = await apiClient.post<
      ApiSingleResponse<{ revoked: number }>
    >(
      "/auth/sessions/revoke-others",
      {},
      refreshToken
        ? { headers: { "X-Refresh-Token": refreshToken } }
        : undefined,
    );
    const { data } = mapSingleResponse(raw);
    return { revoked: Number(data.revoked ?? 0) };
  },

  requestEmailChange: async (
    payload: RequestEmailChangePayload,
  ): Promise<EmailChangePendingResult> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{
        pending_email: string;
        expires_at: string;
      }>
    >("/auth/email-change", {
      newEmail: payload.newEmail,
      currentPassword: payload.currentPassword,
    });
    const { data } = mapSingleResponse(raw);
    return mapEmailChangePending(data);
  },

  cancelEmailChange: async (): Promise<void> => {
    await apiClient.delete("/auth/email-change");
  },

  resendEmailChange: async (): Promise<EmailChangePendingResult> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{
        pending_email: string;
        expires_at: string;
      }>
    >("/auth/email-change/resend");
    const { data } = mapSingleResponse(raw);
    return mapEmailChangePending(data);
  },

  confirmEmailChange: async (
    token: string,
  ): Promise<{ email: string }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ email: string }>
    >("/auth/email-change/confirm", { token });
    const { data } = mapSingleResponse(raw);
    return { email: data.email };
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await apiClient.post<ApiEnvelope<RefreshApiData>>(
      "/auth/refresh",
      { refreshToken },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },

  getProfile: async (): Promise<UserJSON> => {
    const response = await apiClient.get<ApiEnvelope<UserApi>>("/auth/profile", {
      authScope: "tenant",
    });
    return mapUserApiToJson(response.data);
  },

  changePassword: async (
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResult> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ access_token?: string; refresh_token?: string }>
    >("/auth/change-password", {
      currentPassword: payload.currentPassword,
      password: payload.newPassword,
      confirmPassword: payload.confirmNewPassword,
    });
    const { data, message } = mapSingleResponse(raw);
    return {
      accessToken: data.accessToken ?? "",
      refreshToken: data.refreshToken ?? "",
      ...(message ? { message } : {}),
    };
  },

  completeProductOnboarding: async (): Promise<void> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ onboarding_completed_at: string }>
    >("/auth/complete-onboarding");
    mapSingleResponse(raw);
  },

  verifyEmail: async (token: string): Promise<{ emailVerifiedAt: string }> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ email_verified_at: string }>
    >("/auth/verify-email", { token });
    const { data } = mapSingleResponse(raw);
    return {
      emailVerifiedAt:
        (data as { emailVerifiedAt?: string }).emailVerifiedAt ??
        (data as { email_verified_at?: string }).email_verified_at!,
    };
  },

  resendEmailVerification: async (): Promise<{ message?: string }> => {
    const raw = await apiClient.post<ApiSingleResponse<null>>(
      "/auth/resend-email-verification",
    );
    const { message } = mapSingleResponse(raw);
    return message ? { message } : {};
  },

  updateProfile: async (
    payload: UpdateMyProfilePayload,
  ): Promise<UpdateProfileResult> => {
    const raw = await apiClient.patch<
      ApiSingleResponse<UserCamelPartial> & { access_token?: string }
    >("/auth/profile", {
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
    const { data } = mapSingleResponse(raw);
    return {
      user: mapUserCamelToJson(data),
      ...(raw.access_token ? { accessToken: raw.access_token } : {}),
    };
  },
};
