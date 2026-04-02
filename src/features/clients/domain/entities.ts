/**
 * Client Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Tipos, interfaces y constantes para el módulo de Clientes.
 * Incluye entidades de Cliente y Direcciones de Cliente.
 *
 * IMPORTANTE:
 * - Los campos de dirección fiscal en la tabla `clients` son LEGACY
 * - Todas las direcciones (incluyendo fiscal) se manejan en `client_addresses`
 * - Las direcciones usan campos Carta Porte 3.1 (códigos SAT)
 *
 * Ubicación: src/features/clients/domain/entities.ts
 */

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
 * Tipo de dirección del cliente
 */
export type AddressType =
  | "billing" // Facturación (dirección fiscal)
  | "shipping" // Envío/Entrega
  | "pickup" // Recolección
  | "warehouse" // Almacén/Bodega
  | "office" // Oficina
  | "other"; // Otro

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
  taxRegime?: string; // Régimen fiscal SAT

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

  // Estado
  isActive: boolean;
  notes?: string;

  // Auditoría
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
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
  city?: string;
  state?: string;
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
  // CAMPOS CARTA PORTE 3.1 (códigos SAT)
  // ═══════════════════════════════════════════════════════════════════════════
  satEstadoCode?: string; // c_Estado (ej: "JAL", "NLE")
  satMunicipioCode?: string; // c_Municipio (ej: "JAL-001")
  satLocalidadCode?: string; // c_Localidad (opcional, zonas rurales)
  satColoniaCode?: string; // c_Colonia (filtrada por CP)
  postalCode?: string; // Código postal

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

  // Campos SAT para mostrar
  satEstadoCode?: string;
  satMunicipioCode?: string;
  postalCode?: string;

  // Campos legacy para display (si no hay SAT)
  address?: string;
  city?: string;
  state?: string;

  // Contacto
  contactName?: string;
  contactPhone?: string;
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
  other: "outline",
};

/**
 * Regímenes fiscales comunes en México (SAT)
 * Códigos según catálogo c_RegimenFiscal del SAT
 */
export const TAX_REGIME_OPTIONS = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  { value: "605", label: "605 - Sueldos y Salarios" },
  { value: "606", label: "606 - Arrendamiento" },
  {
    value: "607",
    label: "607 - Régimen de Enajenación o Adquisición de Bienes",
  },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero" },
  { value: "611", label: "611 - Ingresos por Dividendos" },
  {
    value: "612",
    label: "612 - Personas Físicas con Actividades Empresariales",
  },
  { value: "614", label: "614 - Ingresos por intereses" },
  {
    value: "615",
    label: "615 - Régimen de los ingresos por obtención de premios",
  },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas de Producción" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  {
    value: "622",
    label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  },
  { value: "623", label: "623 - Opcional para Grupos de Sociedades" },
  { value: "624", label: "624 - Coordinados" },
  {
    value: "625",
    label:
      "625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
] as const;

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
export function isAddressType(value: unknown): value is AddressType {
  return [
    "billing",
    "shipping",
    "pickup",
    "warehouse",
    "office",
    "other",
  ].includes(value as string);
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
  if (!address.satEstadoCode && address.city) {
    parts.push(address.city);
  }
  if (!address.satEstadoCode && address.state) {
    parts.push(address.state);
  }

  return parts.join(", ") || address.address || "Sin dirección";
}

/**
 * Verifica si la dirección tiene datos completos para Carta Porte
 */
export function isCartaPorteReady(address: ClientAddress): boolean {
  return !!(
    address.satEstadoCode &&
    address.satMunicipioCode &&
    address.postalCode
  );
}

/**
 * Obtiene los campos faltantes para Carta Porte
 */
export function getCartaPorteMissingFields(address: ClientAddress): string[] {
  const missing: string[] = [];

  if (!address.satEstadoCode) missing.push("Estado");
  if (!address.satMunicipioCode) missing.push("Municipio");
  if (!address.postalCode) missing.push("Código Postal");

  return missing;
}
