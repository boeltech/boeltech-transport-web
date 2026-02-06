/**
 * useClientAddresses Hook
 * FSD: Features Layer - Clients
 *
 * Hook para obtener direcciones de un cliente específico.
 * Usado en formularios para seleccionar direcciones de clientes.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import type { ClientAddress, AddressTypeValue } from "../../domain/entities";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Respuesta de la API (snake_case)
 */
interface ApiClientAddress {
  id: string;
  tenant_id: string;
  client_id: string;
  address_type: AddressTypeValue;
  is_primary: boolean;
  is_active: boolean;
  location_name: string | null;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_hours: string | null;
  notes: string | null;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

interface ApiAddressesResponse {
  data: ApiClientAddress[];
}

// ============================================================================
// MAPPER
// ============================================================================

/**
 * Mapea respuesta de API (snake_case) a dominio (camelCase)
 */
function mapClientAddress(api: ApiClientAddress): ClientAddress {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    clientId: api.client_id,
    addressType: api.address_type,
    isPrimary: api.is_primary,
    isActive: api.is_active,
    locationName: api.location_name,
    address: api.address,
    city: api.city,
    state: api.state,
    postalCode: api.postal_code,
    country: api.country,
    latitude: api.latitude,
    longitude: api.longitude,
    contactName: api.contact_name,
    contactPhone: api.contact_phone,
    contactEmail: api.contact_email,
    businessHours: api.business_hours,
    notes: api.notes,
    specialInstructions: api.special_instructions,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
    createdBy: api.created_by,
    updatedBy: api.updated_by,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Obtiene las direcciones de un cliente
 */
async function fetchClientAddresses(
  clientId: string,
): Promise<ClientAddress[]> {
  const response = await apiClient.get<ApiAddressesResponse>(
    `/clients/${clientId}/addresses`,
  );

  return response.data.map(mapClientAddress);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Query keys para direcciones de clientes
 */
export const clientAddressKeys = {
  all: ["client-addresses"] as const,
  byClient: (clientId: string) => [...clientAddressKeys.all, clientId] as const,
  active: (clientId: string) =>
    [...clientAddressKeys.byClient(clientId), "active"] as const,
};

/**
 * Hook para obtener direcciones de un cliente
 *
 * @example
 * const { data: addresses, isLoading } = useClientAddresses(clientId);
 */
export function useClientAddresses(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddress[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientAddressKeys.byClient(clientId || ""),
    queryFn: () => fetchClientAddresses(clientId!),
    enabled: !!clientId, // Solo ejecutar si hay clientId
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener direcciones activas de un cliente
 *
 * @example
 * const { data: addresses } = useActiveClientAddresses(clientId);
 */
export function useActiveClientAddresses(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddress[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientAddressKeys.active(clientId || ""),
    queryFn: async () => {
      const addresses = await fetchClientAddresses(clientId!);
      return addresses.filter((addr) => addr.isActive);
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { fetchClientAddresses };
export type { ClientAddress };
