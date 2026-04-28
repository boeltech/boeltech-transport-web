/**
 * Direcciones de empleado (anidadas bajo `/employees/:id/addresses`).
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

function base(employeeId: string): string {
  return `/employees/${employeeId}/addresses`;
}

export function pickEmployeePersonalAddress(
  addresses: ClientAddress[],
): ClientAddress | null {
  const personal = addresses.filter((a) => a.addressType === "personal");
  if (personal.length === 0) return null;
  return personal.find((a) => a.isPrimary) ?? personal[0] ?? null;
}

export async function fetchEmployeeAddresses(
  employeeId: string,
): Promise<ClientAddress[]> {
  const res = await apiClient.get<{ data: ClientAddressApiResponse[] }>(
    base(employeeId),
  );
  return res.data.map(mapClientAddress);
}

export async function createEmployeeAddress(
  employeeId: string,
  dto: CreateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.post<{ data: ClientAddressApiResponse }>(
    base(employeeId),
    toApiCreateClientAddress(dto),
  );
  return mapClientAddress(response.data);
}

export async function updateEmployeeAddress(
  employeeId: string,
  addressId: string,
  dto: UpdateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.put<{ data: ClientAddressApiResponse }>(
    `${base(employeeId)}/${addressId}`,
    toApiUpdateClientAddress(dto),
  );
  return mapClientAddress(response.data);
}
