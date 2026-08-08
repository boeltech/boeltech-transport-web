import type {
  TenantActivationAcceptResult,
  TenantActivationVerifyPayload,
} from "../domain/entities";

export interface ApiTenantActivationVerify {
  email_masked: string;
  company_name: string;
  subdomain: string;
  expires_at: string;
}

export interface ApiTenantActivationAccept {
  subdomain: string;
  email_masked: string;
}

export const mapTenantActivationVerify = (
  raw: ApiTenantActivationVerify,
): TenantActivationVerifyPayload => ({
  emailMasked: raw.email_masked,
  companyName: raw.company_name,
  subdomain: raw.subdomain,
  expiresAt: raw.expires_at,
});

export const mapTenantActivationAccept = (
  raw: ApiTenantActivationAccept,
): TenantActivationAcceptResult => ({
  subdomain: raw.subdomain,
  emailMasked: raw.email_masked,
});
