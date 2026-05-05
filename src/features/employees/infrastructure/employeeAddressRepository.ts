/**
 * Direcciones de empleado (anidadas bajo `/employees/:id/addresses`).
 */

import { apiClient } from "@shared/api";
import { isApiError } from "@shared/api/interceptors/error-handler";
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
  try {
    const res = await apiClient.get<{ data: ClientAddressApiResponse[] }>(
      base(employeeId),
    );
    return res.data.map(mapClientAddress);
  } catch (error) {
    // Algunos despliegues devuelven 404 para este sub-recurso (p. ej. empleado dado de baja
    // o sin filas en `addresses`). Un listado vacío es el comportamiento esperado en UI.
    if (isApiError(error) && error.isNotFound()) {
      return [];
    }
    throw error;
  }
}

export async function fetchEmployeeAddressById(
  employeeId: string,
  addressId: string,
): Promise<ClientAddress> {
  const res = await apiClient.get<{ data: ClientAddressApiResponse }>(
    `${base(employeeId)}/${addressId}`,
  );
  return mapClientAddress(res.data);
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
