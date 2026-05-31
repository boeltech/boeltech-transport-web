/**
 * Client Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Tipos, interfaces y constantes para el módulo de Clientes.
 * Incluye entidades de Cliente y Direcciones de Cliente.
 *
 * IMPORTANTE:
 * - Los campos de dirección fiscal en la tabla `clients` son LEGACY
 * - Las direcciones del cliente persisten en la tabla unificada `addresses`
 *   (`owner_type = 'client'`) expuestas por `/clients/:id/addresses*`
 * - Códigos SAT en API y dominio usan nombres en inglés (satStateCode, etc.)
 *
 * Ubicación: src/features/clients/domain/entities.ts
 */

import {
  getCartaPorteListBadgeMissingFields,
  isCartaPorteListBadgeReady,
  toSharedAddressInput,
} from "@boeltech/cfdi-domain";

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

/**
 * Tipo de cliente según el SAT
 * - individual: Persona Física
 * - company: Persona Moral
 */
export type ClientType = "individual" | "company";

/**
 * Términos de pago
 * - cash: Contado
 * - credit: Crédito
 */
export type PaymentTerms = "cash" | "credit";

/**
 * Tipo de dirección (tabla unificada `addresses`, alineado a catálogos SAT / ADR-0043).
 */
export type AddressType =
  | "billing"
  | "shipping"
  | "pickup"
  | "warehouse"
  | "office"
  | "personal"
  | "trip_origin"
  | "trip_destination"
  | "trip_stop"
  | "company"
  | "branch"
  | "other";

// ============================================================================
// CLIENT ENTITIES
// ============================================================================

/**
 * Entidad completa de Cliente (para detalle)
 */
export interface Client {
  id: string;
  tenantId: string;
  clientCode: string;

  // Información del negocio
  type: ClientType;
  legalName: string;
  tradeName?: string;
  taxId: string; // RFC
  taxRegime: string; // Régimen fiscal SAT

  // Contacto principal
  contactName?: string;
  contactPosition?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  billingEmail?: string;

  // Términos comerciales
  paymentTerms: PaymentTerms;
  creditDays: number;
  creditLimit?: number;

  // Estado (`isActive` refleja operación; baja lógica en API vía `deleted_at` — no expuesto en GET)
  isActive: boolean;
  notes?: string;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  /** Nombre completo del usuario creador (LEFT JOIN users) — null si no disponible. */
  createdByName?: string;
  /** Nombre completo del usuario que realizó la última actualización. */
  updatedByName?: string;
}

/**
 * Cliente para listados (campos reducidos)
 */
export interface ClientListItem {
  id: string;
  clientCode: string;
  type: ClientType;
  legalName: string;
  tradeName?: string;
  taxId: string;
  phone?: string;
  email?: string;
  paymentTerms: PaymentTerms;
  creditDays: number;
  creditLimit?: number;
  isActive: boolean;
}

/**
 * Cliente para selectores (mínimo)
 */
export interface ClientOption {
  id: string;
  clientCode: string;
  legalName: string;
  tradeName?: string;
  taxId: string;
}

// ============================================================================
// CLIENT ADDRESS ENTITIES
// ============================================================================

/**
 * Dirección completa del cliente (con campos Carta Porte 3.1)
 */
export interface ClientAddress {
  id: string;
  tenantId: string;
  clientId: string;

  // Tipo y estado
  addressType: AddressType;
  isPrimary: boolean;
  isActive: boolean;

  // Nombre del lugar
  locationName?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // Códigos SAT (inglés, alineado a `addresses` / CFDI)
  // ═══════════════════════════════════════════════════════════════════════════
  satCountryCode?: string;
  satStateCode?: string;
  satMunicipalityCode?: string;
  satLocalityCode?: string;
  localityName?: string;
  satNeighborhoodCode?: string;
  neighborhoodName?: string;
  postalCode?: string;

  // Dirección desglosada
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  reference?: string;

  // Datos remitente/destinatario (para Carta Porte)
  rfcRemitenteDestinatario?: string;
  nombreRemitenteDestinatario?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS LEGACY (mantener para compatibilidad, NO usar en UI nueva)
  // ═══════════════════════════════════════════════════════════════════════════
  address?: string; // Campo combinado antiguo
  city?: string; // Texto libre (no catálogo SAT)
  state?: string; // Texto libre (no catálogo SAT)
  country?: string;

  // Coordenadas
  latitude?: number;
  longitude?: number;
  /** Dirección migrada o capturada sin geo completa; no elegible para viajes. */
  geolocationPending?: boolean;
  isCartaPorteReady?: boolean;

  // Contacto en esta dirección
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Operación
  businessHours?: string;
  notes?: string;
  specialInstructions?: string;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Dirección para listados (campos reducidos)
 */
export interface ClientAddressListItem {
  id: string;
  addressType: AddressType;
  isPrimary: boolean;
  isActive: boolean;
  locationName?: string;

  // Campos SAT para mostrar (listado; el API puede omitir parte del detalle)
  satStateCode?: string;
  satMunicipalityCode?: string;
  satLocalityCode?: string;
  localityName?: string;
  satNeighborhoodCode?: string;
  neighborhoodName?: string;
  postalCode?: string;

  // Campos legacy para display (si no hay SAT)
  address?: string;
  city?: string;
  state?: string;

  // Contacto
  contactName?: string;
  contactPhone?: string;

  // Coordenadas (elegibilidad en selectores de paradas / viajes)
  latitude?: number;
  longitude?: number;

  /** Dirección no elegible para viajes hasta completar geolocalización. */
  geolocationPending?: boolean;
  isCartaPorteReady?: boolean;
}

// ============================================================================
// CONSTANTS & LABELS
// ============================================================================

/**
 * Labels para tipo de cliente
 */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individual: "Persona Física",
  company: "Persona Moral",
};

/**
 * Labels para términos de pago
 */
export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  cash: "Contado",
  credit: "Crédito",
};

/**
 * Labels para tipo de dirección
 */
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  billing: "Facturación",
  shipping: "Envío/Entrega",
  pickup: "Recolección",
  warehouse: "Almacén/Bodega",
  office: "Oficina",
  personal: "Personal",
  trip_origin: "Origen de viaje",
  trip_destination: "Destino de viaje",
  trip_stop: "Parada de viaje",
  company: "Empresa / fiscal",
  branch: "Sucursal",
  other: "Otro",
};

/**
 * Colores/variantes para badges de tipo de dirección
 */
export const ADDRESS_TYPE_VARIANTS: Record<
  AddressType,
  "default" | "secondary" | "outline" | "destructive"
> = {
  billing: "default",
  shipping: "secondary",
  pickup: "outline",
  warehouse: "outline",
  office: "secondary",
  personal: "secondary",
  trip_origin: "outline",
  trip_destination: "outline",
  trip_stop: "outline",
  company: "default",
  branch: "outline",
  other: "outline",
};

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query keys para React Query
 * Estructura jerárquica para invalidación granular
 */
export const clientQueryKeys = {
  // Base
  all: ["clients"] as const,

  // Listados
  lists: () => [...clientQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...clientQueryKeys.lists(), filters] as const,

  // Detalle
  details: () => [...clientQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...clientQueryKeys.details(), id] as const,

  // Clientes activos (para selectores)
  active: () => [...clientQueryKeys.all, "active"] as const,

  // Direcciones
  addresses: (clientId: string) =>
    [...clientQueryKeys.detail(clientId), "addresses"] as const,
  address: (clientId: string, addressId: string) =>
    [...clientQueryKeys.addresses(clientId), addressId] as const,
} as const;

// ============================================================================
// WIZARD STEPS
// ============================================================================

/**
 * Pasos del wizard de creación de cliente
 */
export type ClientWizardStep = "info" | "address";

export const CLIENT_WIZARD_STEPS: {
  id: ClientWizardStep;
  title: string;
  description: string;
}[] = [
  {
    id: "info",
    title: "Información del Cliente",
    description: "Datos fiscales, contacto y términos comerciales",
  },
  {
    id: "address",
    title: "Dirección Fiscal",
    description: "Dirección fiscal con campos Carta Porte 3.1",
  },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un ClientType válido
 */
export function isClientType(value: unknown): value is ClientType {
  return value === "individual" || value === "company";
}

/**
 * Verifica si un valor es un PaymentTerms válido
 */
export function isPaymentTerms(value: unknown): value is PaymentTerms {
  return value === "cash" || value === "credit";
}

/**
 * Verifica si un valor es un AddressType válido
 */
const ADDRESS_TYPE_SET = new Set<string>([
  "billing",
  "shipping",
  "pickup",
  "warehouse",
  "office",
  "personal",
  "trip_origin",
  "trip_destination",
  "trip_stop",
  "company",
  "branch",
  "other",
]);

export function isAddressType(value: unknown): value is AddressType {
  return typeof value === "string" && ADDRESS_TYPE_SET.has(value);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Obtiene el nombre para mostrar del cliente
 * Prioriza tradeName sobre legalName
 */
export function getClientDisplayName(client: {
  legalName: string;
  tradeName?: string;
}): string {
  return client.tradeName || client.legalName;
}

/**
 * Formatea la dirección completa para mostrar
 * Prioriza campos SAT sobre legacy
 */
export function formatClientAddress(address: ClientAddress): string {
  const parts: string[] = [];

  // Calle y números
  if (address.street) {
    let line = address.street;
    if (address.exteriorNumber) line += ` ${address.exteriorNumber}`;
    if (address.interiorNumber) line += ` Int. ${address.interiorNumber}`;
    parts.push(line);
  }

  // Código postal
  if (address.postalCode) {
    parts.push(`C.P. ${address.postalCode}`);
  }

  // Si no hay campos SAT, usar legacy
  if (!address.satStateCode && address.city) {
    parts.push(address.city);
  }
  if (!address.satStateCode && address.state) {
    parts.push(address.state);
  }

  return parts.join(", ") || address.address || "Sin dirección";
}

function clientAddressToListBadgeInput(
  address: Pick<
    ClientAddress,
    "satCountryCode" | "satStateCode" | "satMunicipalityCode" | "postalCode"
  >,
) {
  return toSharedAddressInput({
    satCountryCode: address.satCountryCode,
    satStateCode: address.satStateCode,
    satMunicipalityCode: address.satMunicipalityCode,
    postalCode: address.postalCode,
  });
}

/**
 * Badge de listado: delega en `isCartaPorteListBadgeReady` del paquete (mismo criterio que API `is_carta_porte_ready`).
 * Preferir `address.isCartaPorteReady` del API cuando exista. Bloqueo SAT completo: `parseClientAddressFormCreate` / `AddressInput`.
 */
export function isCartaPorteReady(address: ClientAddress): boolean {
  return isCartaPorteListBadgeReady(clientAddressToListBadgeInput(address));
}

/** Campos faltantes del badge de listado (tooltips cuando no hay flag del API). */
export function getCartaPorteMissingFields(address: ClientAddress): string[] {
  return getCartaPorteListBadgeMissingFields(clientAddressToListBadgeInput(address));
}
