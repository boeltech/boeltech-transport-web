/**
 * Direcciones de empleado (anidadas bajo `/employees/:id/addresses`).
 */

import { apiClient, type ApiSingleResponse } from "@shared/api";
import { isApiError } from "@shared/api/interceptors/error-handler";
import type {
  ClientAddress,
  ClientAddressApiResponse,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";
import {
  mapClientAddress,
  mapClientAddressListToDomain,
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
    const response = await apiClient.get<
      ApiSingleResponse<ClientAddressApiResponse[]>
    >(base(employeeId));
    return mapClientAddressListToDomain(response);
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
  const response = await apiClient.get<
    ApiSingleResponse<ClientAddressApiResponse>
  >(`${base(employeeId)}/${addressId}`);
  return mapClientAddress(response).data;
}

export async function createEmployeeAddress(
  employeeId: string,
  dto: CreateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.post<
    ApiSingleResponse<ClientAddressApiResponse>
  >(base(employeeId), toApiCreateClientAddress(dto));
  return mapClientAddress(response).data;
}

export async function updateEmployeeAddress(
  employeeId: string,
  addressId: string,
  dto: UpdateClientAddressDTO,
): Promise<ClientAddress> {
  const response = await apiClient.put<
    ApiSingleResponse<ClientAddressApiResponse>
  >(`${base(employeeId)}/${addressId}`, toApiUpdateClientAddress(dto));
  return mapClientAddress(response).data;
}
