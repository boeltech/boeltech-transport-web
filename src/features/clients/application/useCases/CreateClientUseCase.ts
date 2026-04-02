/**
 * CreateClient Use Case
 * Clean Architecture - Application Layer
 *
 * Caso de uso para crear un cliente CON su dirección fiscal obligatoria.
 * Este es el caso de uso principal usado por el wizard de creación.
 *
 * FLUJO:
 * 1. Crear el cliente (POST /clients)
 * 2. Crear la dirección fiscal (POST /clients/:id/addresses)
 * 3. Retornar el resultado combinado
 *
 * Ubicación: src/features/clients/application/use-cases/CreateClientUseCase.ts
 */

import {
  clientRepository,
  clientAddressRepository,
} from "../../infrastructure";
import type {
  CreateClientDTO,
  CreateClientAddressDTO,
  CreateClientWithAddressDTO,
  CreateClientResult,
} from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class CreateClientUseCase {
  /**
   * Crea un cliente con su dirección fiscal (wizard)
   *
   * @param data - Datos del cliente y dirección fiscal
   * @returns Resultado con IDs del cliente y dirección creados
   * @throws Error si falla la creación del cliente o la dirección
   */
  async execute(data: CreateClientWithAddressDTO): Promise<CreateClientResult> {
    // 1. Crear el cliente
    const { id: clientId, clientCode } = await clientRepository.create(
      data.client,
    );

    try {
      // 2. Crear la dirección fiscal
      // Forzar addressType = 'billing' e isPrimary = true
      const addressData: CreateClientAddressDTO = {
        ...data.billingAddress,
        addressType: "billing",
        isPrimary: true,
      };

      // Pre-llenar RFC y nombre del cliente si no se proporcionaron
      if (!addressData.rfcRemitenteDestinatario) {
        addressData.rfcRemitenteDestinatario = data.client.taxId;
      }
      if (!addressData.nombreRemitenteDestinatario) {
        addressData.nombreRemitenteDestinatario = data.client.legalName;
      }

      const address = await clientAddressRepository.create(
        clientId,
        addressData,
      );

      return {
        clientId,
        clientCode,
        addressId: address.id,
      };
    } catch (error) {
      // Si falla la creación de la dirección, podríamos querer
      // eliminar el cliente creado. Por ahora, propagamos el error.
      // TODO: Implementar rollback o transacción distribuida
      console.error(
        `Error creating billing address for client ${clientId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Crea solo el cliente (sin dirección)
   * Útil para casos donde se crean direcciones por separado
   */
  async createClientOnly(
    data: CreateClientDTO,
  ): Promise<{ id: string; clientCode: string }> {
    return clientRepository.create(data);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const createClientUseCase = new CreateClientUseCase();
