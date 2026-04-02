/**
 * Client Address Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementación del repositorio de direcciones de cliente usando apiClient.
 *
 * Endpoints (anidados bajo /clients/:clientId):
 * - GET    /api/v1/clients/:clientId/addresses          → Lista direcciones
 * - GET    /api/v1/clients/:clientId/addresses/:id      → Detalle dirección
 * - POST   /api/v1/clients/:clientId/addresses          → Crear dirección
 * - PUT    /api/v1/clients/:clientId/addresses/:id      → Actualizar dirección
 * - DELETE /api/v1/clients/:clientId/addresses/:id      → Eliminar dirección
 *
 * Ubicación: src/features/clients/infrastructure/ClientAddressRepository.ts
 */

import { apiClient } from "@shared/api";
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
    // El backend devuelve { data: [...] } según client-address.controller.ts
    const response = await apiClient.get<{ data: ClientAddressApiResponse[] }>(
      getBaseUrl(clientId),
    );

    return mapClientAddresses(response.data);
  }

  /**
   * Obtiene una dirección por ID
   */
  async findById(
    clientId: string,
    addressId: string,
  ): Promise<ClientAddress | null> {
    try {
      // El backend devuelve la dirección directamente (sin wrapper)
      // según client-address.controller.ts línea 37
      const response = await apiClient.get<ClientAddressApiResponse>(
        `${getBaseUrl(clientId)}/${addressId}`,
      );
      return mapClientAddress(response);
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

    // El backend devuelve la dirección creada directamente
    // según client-address.controller.ts línea 53
    const response = await apiClient.post<ClientAddressApiResponse>(
      getBaseUrl(clientId),
      payload,
    );

    return mapClientAddress(response);
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

    // El backend devuelve la dirección actualizada directamente
    const response = await apiClient.put<ClientAddressApiResponse>(
      `${getBaseUrl(clientId)}/${addressId}`,
      payload,
    );

    return mapClientAddress(response);
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
