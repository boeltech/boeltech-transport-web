/**
 * UpdateClient Use Case
 * Clean Architecture - Application Layer
 *
 * Caso de uso para actualizar un cliente existente.
 *
 * Ubicación: src/features/clients/application/use-cases/UpdateClientUseCase.ts
 */

import { clientRepository } from "../../infrastructure";
import type { Client, UpdateClientDTO } from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class UpdateClientUseCase {
  /**
   * Actualiza un cliente existente
   *
   * @param clientId - ID del cliente a actualizar
   * @param data - Datos a actualizar (parcial)
   * @returns Cliente actualizado
   */
  async execute(clientId: string, data: UpdateClientDTO): Promise<Client> {
    return clientRepository.update(clientId, data);
  }

  /**
   * Activa un cliente
   */
  async activate(clientId: string): Promise<Client> {
    return clientRepository.update(clientId, { isActive: true });
  }

  /**
   * Desactiva un cliente
   */
  async deactivate(clientId: string): Promise<Client> {
    return clientRepository.update(clientId, { isActive: false });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const updateClientUseCase = new UpdateClientUseCase();
