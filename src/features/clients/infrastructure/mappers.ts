/**
 * Client Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transformaciones entre formatos API (snake_case) y Domain (camelCase).
 *
 * CONVENCIONES:
 * - Clientes y direcciones: `mapSingleResponse` / `mapPaginatedResponse` (snake → camel) y luego dominio.
 * - `toApi*`: Domain DTO (camelCase) → body JSON; `apiClient` serializa a snake en POST/PUT.
 *
 * NOTA: El apiClient ya hace conversión automática de camelCase a snake_case
 * en POST/PUT/PATCH, pero estos mappers son explícitos para:
 * 1. Mayor control sobre la transformación
 * 2. Documentación clara del contrato API
 * 3. Manejo de campos opcionales/null
 *
 * Ubicación: src/features/clients/infrastructure/mappers.ts
 */

import {
  deepToCamel,
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type DeepCamelCase,
  type MappedSingleResult,
} from "@shared/api";
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
// Helpers: contrato Zod del API (boeltech-transport-api)
// - `.optional()` no acepta `null` (solo ausente o undefined tras JSON).
// - `z.string().email().optional()` falla con "".
// - `z.number().optional()` falla con `null`.
// ============================================================================

function apiOptionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return t === "" ? undefined : t;
}

function apiOptionalEmail(
  value: string | null | undefined,
): string | undefined {
  return apiOptionalTrimmedString(value);
}

// ============================================================================
// CLIENT MAPPERS: API → DOMAIN
// ============================================================================

function mapClientListItemToDomain(
  raw: DeepCamelCase<ClientListItemApiResponse>,
): ClientListItem {
  return {
    id: raw.id,
    clientCode: raw.clientCode,
    type: raw.type as ClientType,
    legalName: raw.legalName,
    tradeName: raw.tradeName ?? undefined,
    taxId: raw.taxId,
    phone: raw.phone ?? undefined,
    email: raw.email ?? undefined,
    paymentTerms: raw.paymentTerms as PaymentTerms,
    creditDays: raw.creditDays,
    creditLimit: raw.creditLimit ?? undefined,
    isActive: raw.isActive,
  };
}

function mapClientToDomain(raw: DeepCamelCase<ClientApiResponse>): Client {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    clientCode: raw.clientCode,
    type: raw.type as ClientType,
    legalName: raw.legalName,
    tradeName: raw.tradeName ?? undefined,
    taxId: raw.taxId,
    taxRegime: raw.taxRegime ?? undefined,
    contactName: raw.contactName ?? undefined,
    contactPosition: raw.contactPosition ?? undefined,
    phone: raw.phone ?? undefined,
    secondaryPhone: raw.secondaryPhone ?? undefined,
    email: raw.email ?? undefined,
    billingEmail: raw.billingEmail ?? undefined,
    paymentTerms: raw.paymentTerms as PaymentTerms,
    creditDays: raw.creditDays,
    creditLimit: raw.creditLimit ?? undefined,
    isActive: raw.isActive,
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
  };
}

/**
 * Recurso único `{ data: Client }` → dominio (patrón `mapDriver`).
 */
export function mapClient(
  response: ApiSingleResponse<ClientApiResponse>,
): MappedSingleResult<Client> {
  const mapped = mapSingleResponse(response);
  return {
    data: mapClientToDomain(mapped.data),
    message: mapped.message,
  };
}

/**
 * Lista paginada de clientes → dominio.
 */
export function mapPaginatedClients(
  response: ApiPaginatedResponse<ClientListItemApiResponse>,
): PaginatedResult<ClientListItem> {
  const mapped = mapPaginatedResponse(response);
  return {
    data: mapped.data.map(mapClientListItemToDomain),
    pagination: mapped.pagination,
  };
}

/**
 * Objeto API en snake_case sin envelope (uso puntual).
 */
export function mapClientFromApi(response: ClientApiResponse): Client {
  return mapClientToDomain(deepToCamel(response));
}

/** @deprecated Use {@link mapPaginatedClients} o `mapClientListItemFromApi`. */
export function mapClientListItem(response: ClientListItemApiResponse): ClientListItem {
  return mapClientListItemToDomain(deepToCamel(response));
}

// ============================================================================
// CLIENT ADDRESS MAPPERS: API → DOMAIN
// ============================================================================

/**
 * Primer valor no vacío (contrato unificado + respuestas legacy).
 */
function firstNonEmpty(
  ...values: (string | null | undefined)[]
): string | undefined {
  for (const v of values) {
    const t = apiOptionalTrimmedString(v);
    if (t !== undefined) return t;
  }
  return undefined;
}

/**
 * Mapea dirección API (camelCase tras `mapSingleResponse`) → dominio.
 */
function mapClientAddressToDomain(
  raw: DeepCamelCase<ClientAddressApiResponse>,
): ClientAddress {
  const cp = raw.cartaPorte;

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    clientId: raw.clientId ?? raw.employeeId ?? "",
    addressType: raw.addressType as AddressType,
    isPrimary: raw.isPrimary,
    isActive: raw.isActive,
    locationName: raw.locationName ?? undefined,
    satCountryCode: firstNonEmpty(raw.satCountryCode) ?? "MEX",
    satStateCode: firstNonEmpty(raw.satStateCode, raw.satEstadoCode),
    satMunicipalityCode: firstNonEmpty(raw.satMunicipalityCode, raw.satMunicipioCode),
    satLocalityCode: firstNonEmpty(raw.satLocalityCode),
    satNeighborhoodCode: firstNonEmpty(raw.satNeighborhoodCode, raw.satColoniaCode),
    neighborhoodName: firstNonEmpty(raw.neighborhoodName),
    postalCode: raw.postalCode ?? undefined,
    street: raw.street ?? undefined,
    exteriorNumber: raw.exteriorNumber ?? undefined,
    interiorNumber: raw.interiorNumber ?? undefined,
    reference: raw.reference ?? undefined,
    rfcRemitenteDestinatario: firstNonEmpty(
      raw.rfcRemitenteDestinatario,
      cp?.remitenteRfc,
    ),
    nombreRemitenteDestinatario: firstNonEmpty(
      raw.nombreRemitenteDestinatario,
      cp?.remitenteName,
    ),
    address: raw.address ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    country: raw.country ?? undefined,
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    geolocationPending: raw.geolocationPending ?? undefined,
    isCartaPorteReady: raw.isCartaPorteReady ?? undefined,
    contactName: firstNonEmpty(raw.contactName, cp?.contactName),
    contactPhone: firstNonEmpty(raw.contactPhone, cp?.contactPhone),
    contactEmail: firstNonEmpty(raw.contactEmail, cp?.contactEmail),
    businessHours: firstNonEmpty(raw.businessHours, cp?.businessHours),
    notes: raw.notes ?? undefined,
    specialInstructions: firstNonEmpty(
      raw.specialInstructions,
      cp?.specialInstructions,
    ),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
  };
}

function mapClientAddressListItemToDomain(
  raw: DeepCamelCase<ClientAddressApiResponse>,
): ClientAddressListItem {
  const cp = raw.cartaPorte;
  return {
    id: raw.id,
    addressType: raw.addressType as AddressType,
    isPrimary: raw.isPrimary,
    isActive: raw.isActive,
    locationName: raw.locationName ?? undefined,
    satStateCode: firstNonEmpty(raw.satStateCode, raw.satEstadoCode),
    satMunicipalityCode: firstNonEmpty(raw.satMunicipalityCode, raw.satMunicipioCode),
    satLocalityCode: firstNonEmpty(raw.satLocalityCode),
    satNeighborhoodCode: firstNonEmpty(raw.satNeighborhoodCode, raw.satColoniaCode),
    neighborhoodName: firstNonEmpty(raw.neighborhoodName),
    postalCode: raw.postalCode ?? undefined,
    address: raw.address ?? undefined,
    contactName: firstNonEmpty(raw.contactName, cp?.contactName),
    contactPhone: firstNonEmpty(raw.contactPhone, cp?.contactPhone),
    latitude: raw.latitude ?? undefined,
    longitude: raw.longitude ?? undefined,
    geolocationPending: raw.geolocationPending ?? undefined,
    isCartaPorteReady: raw.isCartaPorteReady ?? undefined,
  };
}

/**
 * Recurso único `{ data: Address }` → dominio (patrón `mapDriver`).
 */
export function mapClientAddress(
  response: ApiSingleResponse<ClientAddressApiResponse>,
): MappedSingleResult<ClientAddress> {
  const mapped = mapSingleResponse(response);
  return {
    data: mapClientAddressToDomain(mapped.data),
    message: mapped.message,
  };
}

/**
 * Lista en envelope `{ data: Address[] }` → ítems de listado.
 */
export function mapClientAddressList(
  response: ApiSingleResponse<ClientAddressApiResponse[]>,
): ClientAddressListItem[] {
  const mapped = mapSingleResponse(response);
  return mapped.data.map(mapClientAddressListItemToDomain);
}

/**
 * Lista en envelope `{ data: Address[] }` → entidades completas de dominio.
 */
export function mapClientAddressListToDomain(
  response: ApiSingleResponse<ClientAddressApiResponse[]>,
): ClientAddress[] {
  const mapped = mapSingleResponse(response);
  return mapped.data.map(mapClientAddressToDomain);
}

/**
 * Objeto API en snake_case sin envelope (p. ej. `company_address` embebido).
 */
export function mapClientAddressFromApi(
  response: ClientAddressApiResponse,
): ClientAddress {
  return mapClientAddressToDomain(deepToCamel(response));
}

/** @deprecated Use {@link mapClientAddressList} con el envelope completo. */
export function mapClientAddressListItem(
  response: ClientAddressApiResponse,
): ClientAddressListItem {
  return mapClientAddressListItemToDomain(deepToCamel(response));
}

/** @deprecated Use {@link mapClientAddressList} con el envelope completo. */
export function mapClientAddresses(
  responses: ClientAddressApiResponse[],
): ClientAddressListItem[] {
  return responses.map((item) => mapClientAddressListItemToDomain(deepToCamel(item)));
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
  const payload: Record<string, unknown> = {
    type: dto.type,
    legal_name: dto.legalName,
    tax_id: dto.taxId.toUpperCase(),
    payment_terms: dto.paymentTerms,
    credit_days: dto.creditDays ?? 0,
    credit_limit: dto.creditLimit ?? 0,
  };

  const tradeName = apiOptionalTrimmedString(dto.tradeName);
  if (tradeName !== undefined) payload.trade_name = tradeName;

  const taxRegime = apiOptionalTrimmedString(dto.taxRegime);
  if (taxRegime !== undefined) payload.tax_regime = taxRegime;

  const contactName = apiOptionalTrimmedString(dto.contactName);
  if (contactName !== undefined) payload.contact_name = contactName;

  const contactPosition = apiOptionalTrimmedString(dto.contactPosition);
  if (contactPosition !== undefined) payload.contact_position = contactPosition;

  const phone = apiOptionalTrimmedString(dto.phone);
  if (phone !== undefined) payload.phone = phone;

  const secondaryPhone = apiOptionalTrimmedString(dto.secondaryPhone);
  if (secondaryPhone !== undefined) payload.secondary_phone = secondaryPhone;

  const email = apiOptionalEmail(dto.email);
  if (email !== undefined) payload.email = email;

  const billingEmail = apiOptionalEmail(dto.billingEmail);
  if (billingEmail !== undefined) payload.billing_email = billingEmail;

  const notes = apiOptionalTrimmedString(dto.notes);
  if (notes !== undefined) payload.notes = notes;

  return payload;
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
 * Convierte DTO de creación de dirección a body JSON (camelCase).
 * `apiClient` aplica `deepToSnake` antes de enviar.
 */
export function toApiCreateClientAddress(
  dto: CreateClientAddressDTO,
): Record<string, unknown> {
  return {
    addressType: dto.addressType,
    isPrimary: dto.isPrimary ?? false,
    locationName: dto.locationName,
    satCountryCode: dto.satCountryCode ?? "MEX",
    satStateCode: dto.satStateCode,
    satMunicipalityCode: dto.satMunicipalityCode,
    satLocalityCode: dto.satLocalityCode,
    satNeighborhoodCode: dto.satNeighborhoodCode,
    neighborhoodName: dto.neighborhoodName,
    postalCode: dto.postalCode,
    street: dto.street,
    exteriorNumber: dto.exteriorNumber,
    interiorNumber: dto.interiorNumber,
    reference: dto.reference,
    rfcRemitenteDestinatario: dto.rfcRemitenteDestinatario,
    nombreRemitenteDestinatario: dto.nombreRemitenteDestinatario,
    latitude: dto.latitude,
    longitude: dto.longitude,
    geolocationPending: dto.geolocationPending,
    geocodingSource: dto.geocodingSource,
    contactName: dto.contactName,
    contactPhone: dto.contactPhone,
    contactEmail: dto.contactEmail,
    businessHours: dto.businessHours,
    notes: dto.notes,
    specialInstructions: dto.specialInstructions,
  };
}

/**
 * Convierte DTO de actualización de dirección a body JSON (camelCase).
 * Solo incluye claves definidas; `apiClient` serializa a snake_case.
 */
export function toApiUpdateClientAddress(
  dto: UpdateClientAddressDTO,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  );
}
