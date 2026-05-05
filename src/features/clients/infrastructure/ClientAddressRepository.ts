/**
 * Client Address Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementación del repositorio de direcciones de cliente usando apiClient.
 *
 * Endpoints (anidados bajo /clients/:clientId):
 * - GET    …/addresses          → { data: Address[] }  (ver API Response Standard)
 * - GET    …/addresses/:id      → { data: Address }
 * - POST   …/addresses          → 201 { data: Address }
 * - PUT    …/addresses/:id      → { data: Address }
 * - DELETE …/addresses/:id      → acción
 *
 * Contrato backend (fuente de verdad): `boeltech-transport-api` →
 * `src/modules/commercial/clients/client-address.controller.ts` (siempre envelope `data` en lecturas/altas/edición de recurso).
 *
 * Ubicación: src/features/clients/infrastructure/ClientAddressRepository.ts
 */

import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  ClientAddress,
  ClientAddressListItem,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
  IClientAddressRepository,
  ClientAddressApiResponse,
} from "../domain";
import {
  mapClientAddress,
  mapClientAddresses,
  toApiCreateClientAddress,
  toApiUpdateClientAddress,
} from "./mappers";

// ============================================================================
// HELPER
// ============================================================================

function getBaseUrl(clientId: string): string {
  return `/clients/${clientId}/addresses`;
}

// ============================================================================
// REPOSITORY IMPLEMENTATION
// ============================================================================

class ClientAddressRepository implements IClientAddressRepository {
  /**
   * Obtiene todas las direcciones de un cliente
   */
  async findByClientId(clientId: string): Promise<ClientAddressListItem[]> {
    const { data } = await apiClient.get<
      ApiSingleResponse<ClientAddressApiResponse[]>
    >(getBaseUrl(clientId));

    return mapClientAddresses(data);
  }

  /**
   * Obtiene una dirección por ID
   */
  async findById(
    clientId: string,
    addressId: string,
  ): Promise<ClientAddress | null> {
    try {
      const { data } = await apiClient.get<
        ApiSingleResponse<ClientAddressApiResponse>
      >(`${getBaseUrl(clientId)}/${addressId}`);
      return mapClientAddress(data);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Crea una nueva dirección para un cliente
   */
  async create(
    clientId: string,
    data: CreateClientAddressDTO,
  ): Promise<ClientAddress> {
    const payload = toApiCreateClientAddress(data);

    const response = await apiClient.post<
      ApiSingleResponse<ClientAddressApiResponse>
    >(getBaseUrl(clientId), payload);

    return mapClientAddress(response.data);
  }

  /**
   * Actualiza una dirección existente
   */
  async update(
    clientId: string,
    addressId: string,
    data: UpdateClientAddressDTO,
  ): Promise<ClientAddress> {
    const payload = toApiUpdateClientAddress(data);

    const response = await apiClient.put<
      ApiSingleResponse<ClientAddressApiResponse>
    >(`${getBaseUrl(clientId)}/${addressId}`, payload);

    return mapClientAddress(response.data);
  }

  /**
   * Elimina una dirección (hard delete)
   */
  async delete(clientId: string, addressId: string): Promise<void> {
    await apiClient.delete(`${getBaseUrl(clientId)}/${addressId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MÉTODOS ADICIONALES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene la dirección fiscal (billing) de un cliente
   */
  async findBillingAddress(clientId: string): Promise<ClientAddress | null> {
    const addresses = await this.findByClientId(clientId);
    const billing = addresses.find((addr) => addr.addressType === "billing");

    if (!billing) return null;

    // Obtener detalle completo
    return this.findById(clientId, billing.id);
  }

  /**
   * Obtiene la dirección primaria de un cliente
   */
  async findPrimaryAddress(clientId: string): Promise<ClientAddress | null> {
    const addresses = await this.findByClientId(clientId);
    const primary = addresses.find((addr) => addr.isPrimary);

    if (!primary) return null;

    return this.findById(clientId, primary.id);
  }

  /**
   * Verifica si el cliente tiene dirección fiscal
   */
  async hasBillingAddress(clientId: string): Promise<boolean> {
    const addresses = await this.findByClientId(clientId);
    return addresses.some((addr) => addr.addressType === "billing");
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const clientAddressRepository = new ClientAddressRepository();
