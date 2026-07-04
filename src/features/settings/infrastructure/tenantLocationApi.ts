/**
 * Tenant directory locations API (`/settings/locations`).
 */

import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  ClientAddress,
  ClientAddressApiResponse,
  ClientAddressListItem,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";
import {
  mapClientAddress,
  mapClientAddressListToDomain,
  toApiCreateClientAddress,
  toApiUpdateClientAddress,
} from "@features/clients/infrastructure/mappers";

const BASE = "/settings/locations";

export async function fetchTenantLocations(): Promise<ClientAddressListItem[]> {
  const response = await apiClient.get<
    ApiSingleResponse<ClientAddressApiResponse[]>
  >(BASE);
  return mapClientAddressListToDomain(response);
}

export async function fetchTenantLocationById(
  id: string,
): Promise<ClientAddress> {
  const response = await apiClient.get<ApiSingleResponse<ClientAddressApiResponse>>(
    `${BASE}/${id}`,
  );
  return mapClientAddress(response).data;
}

export async function createTenantLocation(
  dto: CreateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.post<ApiSingleResponse<ClientAddressApiResponse>>(
    BASE,
    toApiCreateClientAddress(dto),
  );
  return mapClientAddress(response).data;
}

export async function updateTenantLocation(
  id: string,
  dto: UpdateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.put<ApiSingleResponse<ClientAddressApiResponse>>(
    `${BASE}/${id}`,
    toApiUpdateClientAddress(dto),
  );
  return mapClientAddress(response).data;
}

export async function deleteTenantLocation(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
