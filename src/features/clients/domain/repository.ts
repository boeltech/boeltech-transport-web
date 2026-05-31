/**
 * Client Repository Interfaces & DTOs
 * Clean Architecture - Domain Layer
 *
 * Define los contratos (interfaces) para los repositorios y los DTOs
 * para transferencia de datos entre capas.
 *
 * **Soft delete:** el API filtra `deleted_at IS NULL` en lecturas; los clientes
 * eliminados no aparecen en listados ni detalle. El dominio web no modela `deletedAt`.
 *
 * IMPORTANTE:
 * - Las funciones `toApi*` convierten a snake_case para el backend
 * - Los DTOs del dominio usan camelCase
 * - El apiClient ya hace conversión automática, pero los mappers
 *   son explícitos para mayor claridad y control
 *
 * Ubicación: src/features/clients/domain/repository.ts
 */

import type {
  Client,
  ClientListItem,
  ClientAddress,
  ClientAddressListItem,
  ClientType,
  PaymentTerms,
  AddressType,
} from "./entities";

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// CLIENT FILTER PARAMS
// ============================================================================

export interface ClientFilters {
  type?: ClientType;
  paymentTerms?: PaymentTerms;
  isActive?: boolean;
  search?: string;
}

// ============================================================================
// CLIENT DTOs
// ============================================================================

/**
 * DTO para crear un cliente
 * Solo contiene los campos del cliente, SIN dirección
 * La dirección se crea por separado en client_addresses
 */
export interface CreateClientDTO {
  // Tipo de cliente
  type: ClientType;

  // Información fiscal
  legalName: string;
  tradeName?: string;
  taxId: string; // RFC
  taxRegime: string; // Régimen fiscal

  // Contacto principal
  contactName?: string;
  contactPosition?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  billingEmail?: string;

  // Términos comerciales
  paymentTerms: PaymentTerms;
  creditDays?: number;
  creditLimit?: number;

  // Notas
  notes?: string;
}

/**
 * DTO para actualizar un cliente
 */
export interface UpdateClientDTO extends Partial<CreateClientDTO> {
  isActive?: boolean;
}

// ============================================================================
// CLIENT ADDRESS DTOs
// ============================================================================

/**
 * DTO para crear una dirección de cliente
 * Incluye todos los campos Carta Porte 3.1
 */
export interface CreateClientAddressDTO {
  // Tipo y configuración
  addressType: AddressType;
  isPrimary?: boolean;

  // Nombre del lugar
  locationName?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // Códigos SAT (inglés, contrato `addresses`)
  // ═══════════════════════════════════════════════════════════════════════════
  satCountryCode?: string;
  satStateCode: string;
  /** c_Municipio (opcional XSD CP3.1, `use="optional"`). */
  satMunicipalityCode?: string | null;
  satLocalityCode?: string;
  localityName?: string;
  satNeighborhoodCode?: string;
  neighborhoodName?: string;
  postalCode: string;

  // Dirección desglosada
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  reference?: string;

  // Datos remitente/destinatario
  rfcRemitenteDestinatario?: string;
  nombreRemitenteDestinatario?: string;

  // Coordenadas (opcionales). `null` indica intención explícita de limpiar el valor
  // existente al actualizar (sin null el merge en backend conservaría las coords
  // previas y dispararía GEOLOCATION_PENDING_CONFLICT al fijar `geolocationPending=true`).
  latitude?: number | null;
  longitude?: number | null;
  geolocationPending?: boolean;
  geocodingSource?: "manual" | "mapbox" | "google" | "nominatim" | null;

  // Contacto en esta dirección
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Operación
  businessHours?: string;
  notes?: string;
  specialInstructions?: string;
}

/**
 * DTO para actualizar una dirección de cliente
 */
export interface UpdateClientAddressDTO extends Partial<CreateClientAddressDTO> {
  isActive?: boolean;
}

// ============================================================================
// WIZARD DTOs (para crear cliente con dirección fiscal)
// ============================================================================

/**
 * DTO combinado para el wizard de creación de cliente
 * Incluye datos del cliente + dirección fiscal obligatoria
 */
export interface CreateClientWithAddressDTO {
  // Datos del cliente (Paso 1)
  client: CreateClientDTO;

  // Dirección fiscal (Paso 2)
  billingAddress: CreateClientAddressDTO;
}

/**
 * Resultado de la creación de cliente con dirección
 */
export interface CreateClientResult {
  clientId: string;
  clientCode: string;
  addressId: string;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de clientes
 */
export interface IClientRepository {
  // Queries
  findAll(
    filters: ClientFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<ClientListItem>>;

  findById(id: string): Promise<Client | null>;

  findActive(): Promise<ClientListItem[]>;

  // Commands
  create(data: CreateClientDTO): Promise<{ id: string; clientCode: string }>;

  update(id: string, data: UpdateClientDTO): Promise<Client>;

  delete(id: string): Promise<void>;
}

/**
 * Interfaz del repositorio de direcciones de cliente
 */
export interface IClientAddressRepository {
  // Queries
  findByClientId(clientId: string): Promise<ClientAddressListItem[]>;

  findById(clientId: string, addressId: string): Promise<ClientAddress | null>;

  // Commands
  create(
    clientId: string,
    data: CreateClientAddressDTO,
  ): Promise<ClientAddress>;

  update(
    clientId: string,
    addressId: string,
    data: UpdateClientAddressDTO,
  ): Promise<ClientAddress>;

  setPrimaryAddress(clientId: string, addressId: string): Promise<void>;

  delete(clientId: string, addressId: string): Promise<void>;
}

// ============================================================================
// API RESPONSE TYPES (snake_case, como vienen del backend)
// ============================================================================

/**
 * Respuesta del listado de clientes desde el API
 */
export interface ClientListItemApiResponse {
  id: string;
  client_code: string;
  type: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  phone: string | null;
  email: string | null;
  payment_terms: string;
  credit_days: number;
  credit_limit: number | null;
  is_active: boolean;
}

/**
 * Respuesta del detalle de cliente desde el API
 */
export interface ClientApiResponse {
  id: string;
  tenant_id: string;
  client_code: string;
  type: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  tax_regime: string;
  // Contacto
  contact_name: string | null;
  contact_position: string | null;
  phone: string | null;
  secondary_phone: string | null;
  email: string | null;
  billing_email: string | null;
  // Términos comerciales
  payment_terms: string;
  credit_days: number;
  credit_limit: number | null;
  // Estado
  is_active: boolean;
  notes: string | null;
  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
}

/**
 * Respuesta de dirección desde el API
 */
/** Extensión Carta Porte anidada (API unificada) */
export interface ClientAddressCartaPorteApiResponse {
  remitente_rfc: string | null;
  remitente_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_hours: string | null;
  special_instructions: string | null;
}

export interface ClientAddressApiResponse {
  id: string;
  tenant_id: string;
  client_id?: string | null;
  employee_id?: string | null;
  owner_type?: string;
  owner_id?: string;
  address_type: string;
  is_primary: boolean;
  is_active: boolean;
  location_name: string | null;
  /** Contrato unificado (inglés) */
  sat_country_code?: string | null;
  sat_state_code?: string | null;
  sat_municipality_code?: string | null;
  sat_locality_code?: string | null;
  locality_name?: string | null;
  sat_neighborhood_code?: string | null;
  neighborhood_name?: string | null;
  /** Lectura compatible si aún existe respuesta antigua */
  sat_estado_code?: string | null;
  sat_municipio_code?: string | null;
  sat_colonia_code?: string | null;
  postal_code: string | null;
  street: string | null;
  exterior_number: string | null;
  interior_number: string | null;
  reference: string | null;
  rfc_remitente_destinatario?: string | null;
  nombre_remitente_destinatario?: string | null;
  carta_porte?: ClientAddressCartaPorteApiResponse | null;
  // Campos legacy
  address: string;
  city: string;
  state: string | null;
  country: string;
  // Coordenadas
  latitude: number | null;
  longitude: number | null;
  geolocation_pending?: boolean | null;
  is_carta_porte_ready?: boolean | null;
  // Contacto
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  // Operación
  business_hours: string | null;
  notes: string | null;
  special_instructions: string | null;
  // Auditoría
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Respuesta de creación de cliente
 */
export interface CreateClientApiResponse {
  message: string;
  data: {
    id: string;
    client_code: string;
  };
}

/**
 * Respuesta de actualización de cliente
 */
/**
 * Respuesta de actualización de cliente
 */
export interface UpdateClientApiResponse {
  message: string;
  data: ClientApiResponse;
}
