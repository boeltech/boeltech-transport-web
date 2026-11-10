/**
 * GET/PUT /settings/fiscal-policy — modo de Sin factura del tenant.
 */
import type { SinCfdiMode } from "@boeltech/cfdi-domain";
import { apiClient } from "@shared/api";

export interface FiscalPolicy {
  tenantId: string;
  sinCfdiMode: SinCfdiMode;
  createdAt: string;
  updatedAt: string;
}

interface ApiFiscalPolicy {
  tenant_id: string;
  sin_cfdi_mode: SinCfdiMode;
  created_at: string;
  updated_at: string;
}

function mapFiscalPolicy(raw: ApiFiscalPolicy): FiscalPolicy {
  return {
    tenantId: raw.tenant_id,
    sinCfdiMode: raw.sin_cfdi_mode,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
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
