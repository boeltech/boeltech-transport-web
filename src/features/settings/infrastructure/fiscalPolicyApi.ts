/**
 * GET/PUT /settings/fiscal-policy — modo de Sin factura del tenant.
 */
import type { SinCfdiMode } from "@boeltech/cfdi-domain";
import { apiClient } from "@shared/api";

/** Impacto prospectivo al pasar a `disabled` (R4). */
export interface FiscalPolicyDisableImpact {
  comercialOnlyClients: number;
  openExceptionRequests: number;
}

export interface FiscalPolicy {
  tenantId: string;
  sinCfdiMode: SinCfdiMode;
  createdAt: string;
  updatedAt: string;
  /** UUID del último PUT. Null si nadie ha guardado la política. */
  updatedBy: string | null;
  /** Nombre del actor. Null si hay actor pero el nombre no está disponible. */
  updatedByName: string | null;
  /** Conteos tenant-wide para el Dialog warn → disabled (GET siempre los trae). */
  disableImpact: FiscalPolicyDisableImpact;
}

interface ApiFiscalPolicyDisableImpact {
  comercial_only_clients: number;
  open_exception_requests: number;
}

interface ApiFiscalPolicy {
  tenant_id: string;
  sin_cfdi_mode: SinCfdiMode;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  updated_by_name: string | null;
  disable_impact?: ApiFiscalPolicyDisableImpact | null;
}

function mapDisableImpact(
  raw: ApiFiscalPolicyDisableImpact | null | undefined,
): FiscalPolicyDisableImpact {
  return {
    comercialOnlyClients: raw?.comercial_only_clients ?? 0,
    openExceptionRequests: raw?.open_exception_requests ?? 0,
  };
}

function mapFiscalPolicy(raw: ApiFiscalPolicy): FiscalPolicy {
  return {
    tenantId: raw.tenant_id,
    sinCfdiMode: raw.sin_cfdi_mode,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    updatedBy: raw.updated_by ?? null,
    updatedByName: raw.updated_by_name ?? null,
    disableImpact: mapDisableImpact(raw.disable_impact),
  };
}

export const fiscalPolicyApi = {
  async get(): Promise<FiscalPolicy> {
    const response = await apiClient.get<{ data: ApiFiscalPolicy }>(
      "/settings/fiscal-policy",
    );
    return mapFiscalPolicy(response.data);
  },

  async update(sinCfdiMode: SinCfdiMode): Promise<FiscalPolicy> {
    const response = await apiClient.put<{ data: ApiFiscalPolicy }>(
      "/settings/fiscal-policy",
      { sinCfdiMode },
    );
    return mapFiscalPolicy(response.data);
  },
};
