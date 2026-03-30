/**
 * useClientAddresses Hook
 * FSD: Features Layer - Clients
 *
 * Hook para obtener direcciones de un cliente específico.
 * Usado en formularios para seleccionar direcciones de clientes.
 *
 * ACTUALIZADO: Incluye campos SAT para Carta Porte 3.1
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { ClientAddress, AddressTypeValue } from "../../domain/entities";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Respuesta de la API (snake_case)
 * ACTUALIZADO: Incluye campos SAT para Carta Porte 3.1
 */
interface ApiClientAddress {
  id: string;
  tenant_id: string;
  client_id: string;
  address_type: AddressTypeValue;
  is_primary: boolean;
  is_active: boolean;

  // Identificación del lugar
  location_name: string | null;

  // Ubicación SAT (Carta Porte 3.1)
  sat_estado_code: string | null;
  sat_municipio_code: string | null;
  postal_code: string | null;
  sat_localidad_code: string | null;
  sat_colonia_code: string | null;

  // Dirección desglosada
  street: string | null;
  exterior_number: string | null;
  interior_number: string | null;
  reference: string | null;

  // Campos legacy (compatibilidad)
  address: string;
  city: string;
  state: string | null;
  country: string;

  // Coordenadas
  latitude: number | null;
  longitude: number | null;

  // Remitente/Destinatario
  rfc_remitente_destinatario: string | null;
  nombre_remitente_destinatario: string | null;

  // Contacto
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  // Horarios y notas
  business_hours: string | null;
  notes: string | null;
  special_instructions: string | null;

  // Auditoría
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
 * Incluye todos los campos SAT para Carta Porte 3.1
 */
function mapClientAddress(api: ApiClientAddress): ClientAddress {
  return {
    id: api.id,
    tenantId: api.tenant_id,
    clientId: api.client_id,
    addressType: api.address_type,
    isPrimary: api.is_primary,
    isActive: api.is_active,

    // Identificación del lugar
    locationName: api.location_name,

    // Ubicación SAT (Carta Porte 3.1)
    satEstadoCode: api.sat_estado_code,
    satMunicipioCode: api.sat_municipio_code,
    postalCode: api.postal_code,
    satLocalidadCode: api.sat_localidad_code,
    satColoniaCode: api.sat_colonia_code,

    // Dirección desglosada
    street: api.street,
    exteriorNumber: api.exterior_number,
    interiorNumber: api.interior_number,
    reference: api.reference,

    // Campos legacy (compatibilidad)
    address: api.address,
    city: api.city,
    state: api.state,
    country: api.country,

    // Coordenadas
    latitude: api.latitude,
    longitude: api.longitude,

    // Remitente/Destinatario
    rfcRemitenteDestinatario: api.rfc_remitente_destinatario,
    nombreRemitenteDestinatario: api.nombre_remitente_destinatario,

    // Contacto
    contactName: api.contact_name,
    contactPhone: api.contact_phone,
    contactEmail: api.contact_email,

    // Horarios y notas
    businessHours: api.business_hours,
    notes: api.notes,
    specialInstructions: api.special_instructions,

    // Auditoría
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
  cartaPorteReady: (clientId: string) =>
    [...clientAddressKeys.byClient(clientId), "carta-porte-ready"] as const,
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

/**
 * Hook para obtener direcciones listas para Carta Porte
 * (que tienen todos los campos SAT requeridos)
 *
 * @example
 * const { data: addresses } = useCartaPorteReadyAddresses(clientId);
 */
export function useCartaPorteReadyAddresses(
  clientId: string | undefined,
  options?: Omit<
    UseQueryOptions<ClientAddress[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientAddressKeys.cartaPorteReady(clientId || ""),
    queryFn: async () => {
      const addresses = await fetchClientAddresses(clientId!);
      return addresses.filter(
        (addr) =>
          addr.isActive &&
          addr.satEstadoCode &&
          addr.satMunicipioCode &&
          addr.postalCode,
      );
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
