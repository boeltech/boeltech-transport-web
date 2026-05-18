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

import {
  apiClient,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
} from "@shared/api";
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
    const params = new URLSearchParams();

    if (filters.type) params.append("type", filters.type);
    if (filters.paymentTerms)
      params.append("payment_terms", filters.paymentTerms);
    if (filters.isActive !== undefined)
      params.append("is_active", String(filters.isActive));
    if (filters.search) params.append("search", filters.search);

    params.append("page", String(pagination.page));
    params.append("limit", String(pagination.limit));
    if (pagination.sortBy) params.append("sort_by", pagination.sortBy);
    if (pagination.sortOrder) params.append("sort_order", pagination.sortOrder);

    const response = await apiClient.get<
      ApiPaginatedResponse<ClientListItemApiResponse>
    >(`${BASE_URL}?${params.toString()}`);

    return mapPaginatedClients(response);
  }

  /**
   * Obtiene un cliente por ID
   */
  async findById(id: string): Promise<Client | null> {
    try {
      const response = await apiClient.get<ApiSingleResponse<ClientApiResponse>>(
        `${BASE_URL}/${id}`,
      );
      return mapClient(response).data;
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
   * Obtiene lista de clientes activos (para selectores)
   */
  async findActive(): Promise<ClientListItem[]> {
    const params = new URLSearchParams({
      is_active: "true",
      limit: "100",
      sort_by: "legal_name",
      sort_order: "asc",
    });

    const response = await apiClient.get<
      ApiPaginatedResponse<ClientListItemApiResponse>
    >(`${BASE_URL}?${params.toString()}`);

    return mapPaginatedClients(response).data;
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

    const mapped = mapSingleResponse(response);
    return {
      id: mapped.data.id,
      clientCode: mapped.data.clientCode,
    };
  }

  /**
   * Actualiza un cliente existente
   */
  async update(id: string, data: UpdateClientDTO): Promise<Client> {
    const payload = toApiUpdateClient(data);

    const response = await apiClient.put<UpdateClientApiResponse>(
      `${BASE_URL}/${id}`,
      payload,
    );

    return mapClient(response).data;
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
