/**
 * useClients Hook
 * FSD: Features Layer - Clients
 *
 * Hook para obtener listado de clientes con filtros opcionales.
 * Usado principalmente en formularios para seleccionar clientes.
 *
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tipo de cliente
 */
export type ClientType = "individual" | "company";

/**
 * Términos de pago
 */
export type PaymentTerms = "cash" | "credit" | "prepaid";

/**
 * Cliente para listados y selects
 */
export interface ClientListItem {
  id: string;
  clientCode: string;
  legalName: string;
  tradeName?: string;
  taxId: string;
  type: ClientType;
  paymentTerms: PaymentTerms;
  creditDays: number;
  creditLimit?: number;
  phone?: string;
  email?: string;
  isActive: boolean;
}

/**
 * Filtros para consulta de clientes
 */
export interface ClientFilters {
  type?: ClientType;
  paymentTerms?: PaymentTerms;
  isActive?: boolean;
  search?: string;
}

/**
 * Respuesta de la API (snake_case)
 */
interface ApiClientListItem {
  id: string;
  client_code: string;
  legal_name: string;
  trade_name?: string;
  tax_id: string;
  type: ClientType;
  payment_terms: PaymentTerms;
  credit_days: number;
  credit_limit?: number;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface ApiPaginatedResponse {
  data: ApiClientListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// MAPPER
// ============================================================================

/**
 * Mapea respuesta de API (snake_case) a dominio (camelCase)
 */
function mapClientListItem(api: ApiClientListItem): ClientListItem {
  return {
    id: api.id,
    clientCode: api.client_code,
    legalName: api.legal_name,
    tradeName: api.trade_name,
    taxId: api.tax_id,
    type: api.type,
    paymentTerms: api.payment_terms,
    creditDays: api.credit_days,
    creditLimit: api.credit_limit,
    phone: api.phone,
    email: api.email,
    isActive: api.is_active,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const CLIENTS_ENDPOINT = "/clients";

/**
 * Obtiene listado de clientes
 */
async function fetchClients(
  filters?: ClientFilters,
): Promise<ClientListItem[]> {
  const params = new URLSearchParams();

  if (filters?.type) {
    params.append("type", filters.type);
  }

  if (filters?.paymentTerms) {
    params.append("payment_terms", filters.paymentTerms);
  }

  if (filters?.isActive !== undefined) {
    params.append("is_active", String(filters.isActive));
  }

  if (filters?.search) {
    params.append("search", filters.search);
  }

  // Obtener todos los clientes (sin paginación para selects)
  params.append("limit", "100");

  const response = await apiClient.get<ApiPaginatedResponse>(
    `${CLIENTS_ENDPOINT}?${params.toString()}`,
  );

  return response.data.map(mapClientListItem);
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Query keys para clientes
 */
export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (filters?: ClientFilters) => [...clientKeys.lists(), filters] as const,
  active: () => [...clientKeys.list({ isActive: true })] as const,
};

/**
 * Hook para obtener listado de clientes
 *
 * @example
 * // Todos los clientes
 * const { data: clients } = useClients();
 *
 * // Solo clientes activos
 * const { data: clients } = useClients({ isActive: true });
 *
 * // Clientes tipo empresa con crédito
 * const { data: clients } = useClients({ type: 'company', paymentTerms: 'credit' });
 */
export function useClients(
  filters?: ClientFilters,
  options?: Omit<
    UseQueryOptions<ClientListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => fetchClients(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener clientes activos (para asignar a viajes)
 *
 * @example
 * const { data: activeClients, isLoading } = useActiveClients();
 */
export function useActiveClients(
  options?: Omit<
    UseQueryOptions<ClientListItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: clientKeys.active(),
    queryFn: () => fetchClients({ isActive: true }),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { fetchClients };
