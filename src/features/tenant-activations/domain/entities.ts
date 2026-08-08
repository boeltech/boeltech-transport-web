/**
 * Activación pública del admin inicial (ADR-0073).
 * Distinto de @features/invitations (set-password a tenant existente).
 */

export interface TenantActivationVerifyPayload {
  emailMasked: string;
  companyName: string;
  subdomain: string;
  expiresAt: string;
}

export interface TenantActivationAcceptResult {
  subdomain: string;
  emailMasked: string;
}

export const tenantActivationQueryKeys = {
  all: ["tenant-activations"] as const,
  verify: (token: string) =>
    [...tenantActivationQueryKeys.all, "verify", token] as const,
};
