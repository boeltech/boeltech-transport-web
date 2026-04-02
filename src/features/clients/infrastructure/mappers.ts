/**
 * Client Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transformaciones entre formatos API (snake_case) y Domain (camelCase).
 *
 * CONVENCIONES:
 * - `map*`: API Response (snake_case) → Domain Entity (camelCase)
 * - `toApi*`: Domain DTO (camelCase) → API Request (snake_case)
 *
 * NOTA: El apiClient ya hace conversión automática de camelCase a snake_case
 * en POST/PUT/PATCH, pero estos mappers son explícitos para:
 * 1. Mayor control sobre la transformación
 * 2. Documentación clara del contrato API
 * 3. Manejo de campos opcionales/null
 *
 * Ubicación: src/features/clients/infrastructure/mappers.ts
 */

import type {
  // Domain types
  Client,
  ClientListItem,
  ClientAddress,
  ClientAddressListItem,
  ClientType,
  PaymentTerms,
  AddressType,
  // DTOs
  CreateClientDTO,
  UpdateClientDTO,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
  // API Response types
  ClientListItemApiResponse,
  ClientApiResponse,
  ClientAddressApiResponse,
  PaginatedResult,
} from "../domain";

// ============================================================================
// CLIENT MAPPERS: API → DOMAIN
// ============================================================================

/**
 * Mapea respuesta de listado de cliente (API) a entidad de dominio
 */
export function mapClientListItem(
  response: ClientListItemApiResponse,
): ClientListItem {
  return {
    id: response.id,
    clientCode: response.client_code,
    type: response.type as ClientType,
    legalName: response.legal_name,
    tradeName: response.trade_name ?? undefined,
    taxId: response.tax_id,
    city: response.city ?? undefined,
    state: response.state ?? undefined,
    phone: response.phone ?? undefined,
    email: response.email ?? undefined,
    paymentTerms: response.payment_terms as PaymentTerms,
    creditDays: response.credit_days,
    creditLimit: response.credit_limit ?? undefined,
    isActive: response.is_active,
  };
}

/**
 * Mapea respuesta paginada de clientes
 */
export function mapPaginatedClients(response: {
  data: ClientListItemApiResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}): PaginatedResult<ClientListItem> {
  return {
    data: response.data.map(mapClientListItem),
    pagination: response.pagination,
  };
}

/**
 * Mapea respuesta de detalle de cliente (API) a entidad de dominio
 */
export function mapClient(response: ClientApiResponse): Client {
  return {
    id: response.id,
    tenantId: response.tenant_id,
    clientCode: response.client_code,
    type: response.type as ClientType,
    legalName: response.legal_name,
    tradeName: response.trade_name ?? undefined,
    taxId: response.tax_id,
    taxRegime: response.tax_regime ?? undefined,
    // Contacto
    contactName: response.contact_name ?? undefined,
    contactPosition: response.contact_position ?? undefined,
    phone: response.phone ?? undefined,
    secondaryPhone: response.secondary_phone ?? undefined,
    email: response.email ?? undefined,
    billingEmail: response.billing_email ?? undefined,
    // Términos comerciales
    paymentTerms: response.payment_terms as PaymentTerms,
    creditDays: response.credit_days,
    creditLimit: response.credit_limit ?? undefined,
    // Estado
    isActive: response.is_active,
    notes: response.notes ?? undefined,
    // Auditoría
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    createdBy: response.created_by ?? undefined,
    updatedBy: response.updated_by ?? undefined,
  };
}

// ============================================================================
// CLIENT ADDRESS MAPPERS: API → DOMAIN
// ============================================================================

/**
 * Mapea respuesta de dirección (API) a entidad de dominio
 */
export function mapClientAddress(
  response: ClientAddressApiResponse,
): ClientAddress {
  return {
    id: response.id,
    tenantId: response.tenant_id,
    clientId: response.client_id,
    // Tipo y estado
    addressType: response.address_type as AddressType,
    isPrimary: response.is_primary,
    isActive: response.is_active,
    // Nombre del lugar
    locationName: response.location_name ?? undefined,
    // Campos Carta Porte 3.1
    satEstadoCode: response.sat_estado_code ?? undefined,
    satMunicipioCode: response.sat_municipio_code ?? undefined,
    satLocalidadCode: response.sat_localidad_code ?? undefined,
    satColoniaCode: response.sat_colonia_code ?? undefined,
    postalCode: response.postal_code ?? undefined,
    street: response.street ?? undefined,
    exteriorNumber: response.exterior_number ?? undefined,
    interiorNumber: response.interior_number ?? undefined,
    reference: response.reference ?? undefined,
    rfcRemitenteDestinatario: response.rfc_remitente_destinatario ?? undefined,
    nombreRemitenteDestinatario:
      response.nombre_remitente_destinatario ?? undefined,
    // Campos legacy
    address: response.address ?? undefined,
    city: response.city ?? undefined,
    state: response.state ?? undefined,
    country: response.country ?? undefined,
    // Coordenadas
    latitude: response.latitude ?? undefined,
    longitude: response.longitude ?? undefined,
    // Contacto
    contactName: response.contact_name ?? undefined,
    contactPhone: response.contact_phone ?? undefined,
    contactEmail: response.contact_email ?? undefined,
    // Operación
    businessHours: response.business_hours ?? undefined,
    notes: response.notes ?? undefined,
    specialInstructions: response.special_instructions ?? undefined,
    // Auditoría
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    createdBy: response.created_by ?? undefined,
    updatedBy: response.updated_by ?? undefined,
  };
}

/**
 * Mapea respuesta de dirección a item de listado
 */
export function mapClientAddressListItem(
  response: ClientAddressApiResponse,
): ClientAddressListItem {
  return {
    id: response.id,
    addressType: response.address_type as AddressType,
    isPrimary: response.is_primary,
    isActive: response.is_active,
    locationName: response.location_name ?? undefined,
    // Campos SAT
    satEstadoCode: response.sat_estado_code ?? undefined,
    satMunicipioCode: response.sat_municipio_code ?? undefined,
    postalCode: response.postal_code ?? undefined,
    // Campos legacy
    address: response.address ?? undefined,
    city: response.city ?? undefined,
    state: response.state ?? undefined,
    // Contacto
    contactName: response.contact_name ?? undefined,
    contactPhone: response.contact_phone ?? undefined,
  };
}

/**
 * Mapea array de direcciones
 */
export function mapClientAddresses(
  responses: ClientAddressApiResponse[],
): ClientAddressListItem[] {
  return responses.map(mapClientAddressListItem);
}

// ============================================================================
// CLIENT MAPPERS: DOMAIN → API (toApi*)
// ============================================================================

/**
 * Convierte DTO de creación de cliente a formato API (snake_case)
 */
export function toApiCreateClient(
  dto: CreateClientDTO,
): Record<string, unknown> {
  return {
    type: dto.type,
    legal_name: dto.legalName,
    trade_name: dto.tradeName ?? null,
    tax_id: dto.taxId.toUpperCase(),
    tax_regime: dto.taxRegime ?? null,
    // Contacto
    contact_name: dto.contactName ?? null,
    contact_position: dto.contactPosition ?? null,
    phone: dto.phone ?? null,
    secondary_phone: dto.secondaryPhone ?? null,
    email: dto.email ?? null,
    billing_email: dto.billingEmail ?? null,
    // Términos comerciales
    payment_terms: dto.paymentTerms,
    credit_days: dto.creditDays ?? 0,
    credit_limit: dto.creditLimit ?? 0,
    // Notas
    notes: dto.notes ?? null,
  };
}

/**
 * Convierte DTO de actualización de cliente a formato API (snake_case)
 * Solo incluye los campos que están definidos
 */
export function toApiUpdateClient(
  dto: UpdateClientDTO,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.type !== undefined) result.type = dto.type;
  if (dto.legalName !== undefined) result.legal_name = dto.legalName;
  if (dto.tradeName !== undefined) result.trade_name = dto.tradeName;
  if (dto.taxId !== undefined) result.tax_id = dto.taxId.toUpperCase();
  if (dto.taxRegime !== undefined) result.tax_regime = dto.taxRegime;
  // Contacto
  if (dto.contactName !== undefined) result.contact_name = dto.contactName;
  if (dto.contactPosition !== undefined)
    result.contact_position = dto.contactPosition;
  if (dto.phone !== undefined) result.phone = dto.phone;
  if (dto.secondaryPhone !== undefined)
    result.secondary_phone = dto.secondaryPhone;
  if (dto.email !== undefined) result.email = dto.email;
  if (dto.billingEmail !== undefined) result.billing_email = dto.billingEmail;
  // Términos comerciales
  if (dto.paymentTerms !== undefined) result.payment_terms = dto.paymentTerms;
  if (dto.creditDays !== undefined) result.credit_days = dto.creditDays;
  if (dto.creditLimit !== undefined) result.credit_limit = dto.creditLimit;
  // Estado
  if (dto.isActive !== undefined) result.is_active = dto.isActive;
  // Notas
  if (dto.notes !== undefined) result.notes = dto.notes;

  return result;
}

// ============================================================================
// CLIENT ADDRESS MAPPERS: DOMAIN → API (toApi*)
// ============================================================================

/**
 * Convierte DTO de creación de dirección a formato API (snake_case)
 */
export function toApiCreateClientAddress(
  dto: CreateClientAddressDTO,
): Record<string, unknown> {
  return {
    address_type: dto.addressType,
    is_primary: dto.isPrimary ?? false,
    location_name: dto.locationName ?? null,
    // Campos Carta Porte 3.1
    sat_estado_code: dto.satEstadoCode,
    sat_municipio_code: dto.satMunicipioCode,
    sat_localidad_code: dto.satLocalidadCode ?? null,
    sat_colonia_code: dto.satColoniaCode ?? null,
    postal_code: dto.postalCode,
    street: dto.street ?? null,
    exterior_number: dto.exteriorNumber ?? null,
    interior_number: dto.interiorNumber ?? null,
    reference: dto.reference ?? null,
    rfc_remitente_destinatario: dto.rfcRemitenteDestinatario ?? null,
    nombre_remitente_destinatario: dto.nombreRemitenteDestinatario ?? null,
    // Campos legacy (construir address a partir de campos desglosados)
    address: buildLegacyAddress(dto),
    city: "", // Se ignora, pero el backend puede requerirlo
    // Coordenadas
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    // Contacto
    contact_name: dto.contactName ?? null,
    contact_phone: dto.contactPhone ?? null,
    contact_email: dto.contactEmail ?? null,
    // Operación
    business_hours: dto.businessHours ?? null,
    notes: dto.notes ?? null,
    special_instructions: dto.specialInstructions ?? null,
  };
}

/**
 * Convierte DTO de actualización de dirección a formato API (snake_case)
 */
export function toApiUpdateClientAddress(
  dto: UpdateClientAddressDTO,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.addressType !== undefined) result.address_type = dto.addressType;
  if (dto.isPrimary !== undefined) result.is_primary = dto.isPrimary;
  if (dto.locationName !== undefined) result.location_name = dto.locationName;
  // Campos Carta Porte 3.1
  if (dto.satEstadoCode !== undefined)
    result.sat_estado_code = dto.satEstadoCode;
  if (dto.satMunicipioCode !== undefined)
    result.sat_municipio_code = dto.satMunicipioCode;
  if (dto.satLocalidadCode !== undefined)
    result.sat_localidad_code = dto.satLocalidadCode;
  if (dto.satColoniaCode !== undefined)
    result.sat_colonia_code = dto.satColoniaCode;
  if (dto.postalCode !== undefined) result.postal_code = dto.postalCode;
  if (dto.street !== undefined) result.street = dto.street;
  if (dto.exteriorNumber !== undefined)
    result.exterior_number = dto.exteriorNumber;
  if (dto.interiorNumber !== undefined)
    result.interior_number = dto.interiorNumber;
  if (dto.reference !== undefined) result.reference = dto.reference;
  if (dto.rfcRemitenteDestinatario !== undefined)
    result.rfc_remitente_destinatario = dto.rfcRemitenteDestinatario;
  if (dto.nombreRemitenteDestinatario !== undefined)
    result.nombre_remitente_destinatario = dto.nombreRemitenteDestinatario;
  // Coordenadas
  // if (dto.latitude !== undefined) result.latitude = dto.latitude;
  // if (dto.longitude !== undefined) result.longitude = dto.longitude;
  if (dto.latitude !== undefined) result.latitude = 0;
  if (dto.longitude !== undefined) result.longitude = 0;
  // Contacto
  if (dto.contactName !== undefined) result.contact_name = dto.contactName;
  if (dto.contactPhone !== undefined) result.contact_phone = dto.contactPhone;
  if (dto.contactEmail !== undefined) result.contact_email = dto.contactEmail;
  // Operación
  if (dto.businessHours !== undefined)
    result.business_hours = dto.businessHours;
  if (dto.notes !== undefined) result.notes = dto.notes;
  if (dto.specialInstructions !== undefined)
    result.special_instructions = dto.specialInstructions;
  // Estado
  if (dto.isActive !== undefined) result.is_active = dto.isActive;

  // Actualizar campo legacy si hay cambios en dirección
  if (
    dto.street !== undefined ||
    dto.exteriorNumber !== undefined ||
    dto.interiorNumber !== undefined
  ) {
    result.address = buildLegacyAddress(dto as CreateClientAddressDTO);
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Construye el campo legacy `address` a partir de los campos desglosados
 * Esto mantiene compatibilidad con código antiguo que usa el campo combinado
 */
function buildLegacyAddress(dto: CreateClientAddressDTO): string {
  const parts: string[] = [];

  if (dto.street) {
    let line = dto.street;
    if (dto.exteriorNumber) line += ` ${dto.exteriorNumber}`;
    if (dto.interiorNumber) line += ` Int. ${dto.interiorNumber}`;
    parts.push(line);
  }

  if (dto.postalCode) {
    parts.push(`C.P. ${dto.postalCode}`);
  }

  return parts.join(", ") || "Sin dirección";
}
