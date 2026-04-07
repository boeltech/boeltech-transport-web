/**
 * Client Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementación del repositorio de clientes usando apiClient.
 *
 * Endpoints:
 * - GET    /api/v1/clients          → Lista clientes
 * - GET    /api/v1/clients/:id      → Detalle cliente
 * - POST   /api/v1/clients          → Crear cliente
 * - PUT    /api/v1/clients/:id      → Actualizar cliente
 * - DELETE /api/v1/clients/:id      → Eliminar cliente (soft delete)
 *
 * Ubicación: src/features/clients/infrastructure/ClientRepository.ts
 */

import { apiClient } from "@shared/api";
import type {
  Client,
  ClientListItem,
  ClientFilters,
  PaginationParams,
  PaginatedResult,
  CreateClientDTO,
  UpdateClientDTO,
  IClientRepository,
  ClientListItemApiResponse,
  ClientApiResponse,
  CreateClientApiResponse,
  UpdateClientApiResponse,
} from "../domain";
import {
  mapClient,
  mapPaginatedClients,
  mapClientListItem,
  toApiCreateClient,
  toApiUpdateClient,
} from "./mappers";

// ============================================================================
// CONSTANTS
// ============================================================================

const BASE_URL = "/clients";

// ============================================================================
// REPOSITORY IMPLEMENTATION
// ============================================================================

class ClientRepository implements IClientRepository {
  /**
   * Obtiene lista de clientes con filtros y paginación
   */
  async findAll(
    filters: ClientFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<ClientListItem>> {
    // Construir query params
    const params = new URLSearchParams();

    // Filtros
    if (filters.type) params.append("type", filters.type);
    if (filters.paymentTerms)
      params.append("payment_terms", filters.paymentTerms);
    if (filters.isActive !== undefined)
      params.append("is_active", String(filters.isActive));
    if (filters.search) params.append("search", filters.search);

    // Paginación
    params.append("page", String(pagination.page));
    params.append("limit", String(pagination.limit));
    if (pagination.sortBy) params.append("sort_by", pagination.sortBy);
    if (pagination.sortOrder) params.append("sort_order", pagination.sortOrder);

    const response = await apiClient.get<{
      data: ClientListItemApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>(`${BASE_URL}?${params.toString()}`);

    return mapPaginatedClients(response);
  }

  /**
   * Obtiene un cliente por ID
   */
  async findById(id: string): Promise<Client | null> {
    try {
      // El backend devuelve directamente el cliente (sin wrapper { data })
      // según client.controller.ts línea 62
      const response = await apiClient.get<ClientApiResponse>(
        `${BASE_URL}/${id}`,
      );
      return mapClient(response);
    } catch (error: unknown) {
      // Si es 404, retornar null
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
   * Obtiene lista de clientes activos (para selectores)
   */
  async findActive(): Promise<ClientListItem[]> {
    const params = new URLSearchParams({
      is_active: "true",
      limit: "100", // Obtener todos los activos
      sort_by: "legal_name",
      sort_order: "asc",
    });

    const response = await apiClient.get<{
      data: ClientListItemApiResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>(`${BASE_URL}?${params.toString()}`);

    return response.data.map(mapClientListItem);
  }

  /**
   * Crea un nuevo cliente
   */
  async create(
    data: CreateClientDTO,
  ): Promise<{ id: string; clientCode: string }> {
    const payload = toApiCreateClient(data);

    const response = await apiClient.post<CreateClientApiResponse>(
      BASE_URL,
      payload,
    );

    return {
      id: response.id,
      clientCode: response.client_code,
    };
  }

  /**
   * Actualiza un cliente existente
   */
  async update(id: string, data: UpdateClientDTO): Promise<Client> {
    const payload = toApiUpdateClient(data);

    // El backend devuelve { message, client } según client.controller.ts
    const response = await apiClient.put<UpdateClientApiResponse>(
      `${BASE_URL}/${id}`,
      payload,
    );

    return mapClient(response.client);
  }

  /**
   * Elimina un cliente (soft delete)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const clientRepository = new ClientRepository();
