/**
 * GetClients Use Case
 * Clean Architecture - Application Layer
 *
 * Caso de uso para obtener la lista de clientes con filtros y paginación.
 *
 * Ubicación: src/features/clients/application/use-cases/GetClientsUseCase.ts
 */

import { clientRepository } from "../../infrastructure";
import type {
  ClientListItem,
  ClientFilters,
  PaginationParams,
  PaginatedResult,
} from "../../domain";

// ============================================================================
// USE CASE
// ============================================================================

export class GetClientsUseCase {
  /**
   * Ejecuta el caso de uso para obtener clientes paginados
   */
  async execute(
    filters: ClientFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<ClientListItem>> {
    return clientRepository.findAll(filters, pagination);
  }

  /**
   * Obtiene clientes activos (para selectores)
   */
  async getActive(): Promise<ClientListItem[]> {
    return clientRepository.findActive();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const getClientsUseCase = new GetClientsUseCase();
