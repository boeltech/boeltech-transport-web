/**
 * Direcciones del tenant (domicilio fiscal) vía recurso unificado `/addresses`.
 */

import { apiClient } from "@shared/api";
import type {
  ClientAddress,
  ClientAddressApiResponse,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";
import {
  mapClientAddress,
  toApiCreateClientAddress,
  toApiUpdateClientAddress,
} from "@features/clients/infrastructure/mappers";

const ADDRESSES = "/addresses";

export function pickTenantFiscalAddress(
  addresses: ClientAddress[],
): ClientAddress | null {
  const company = addresses.filter((a) => a.addressType === "company");
  if (company.length > 0) {
    return company.find((a) => a.isPrimary) ?? company[0] ?? null;
  }
  const billing = addresses.filter((a) => a.addressType === "billing");
  if (billing.length > 0) {
    return billing.find((a) => a.isPrimary) ?? billing[0] ?? null;
  }
  return null;
}

export async function fetchTenantAddresses(
  tenantId: string,
): Promise<ClientAddress[]> {
  const q = new URLSearchParams({
    owner_type: "tenant",
    owner_id: tenantId,
  });
  const res = await apiClient.get<{ data: ClientAddressApiResponse[] }>(
    `${ADDRESSES}?${q.toString()}`,
  );
  return res.data.map(mapClientAddress);
}

export async function createTenantAddress(
  tenantId: string,
  dto: CreateClientAddressDTO,
): Promise<ClientAddress> {
  const payload: Record<string, unknown> = {
    ownerType: "tenant",
    ownerId: tenantId,
    ...toApiCreateClientAddress(dto),
  };
  const response = await apiClient.post<{ data: ClientAddressApiResponse }>(
    ADDRESSES,
    payload,
  );
  return mapClientAddress(response.data);
}

export async function updateTenantAddress(
  addressId: string,
  dto: UpdateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.put<{ data: ClientAddressApiResponse }>(
    `${ADDRESSES}/${addressId}`,
    toApiUpdateClientAddress(dto),
  );
  return mapClientAddress(response.data);
}
