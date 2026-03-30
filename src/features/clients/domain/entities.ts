/**
 * Client Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Esta capa contiene:
 * - Entidades del negocio (sin dependencias externas)
 * - Value Objects
 * - Enums del dominio
 * - Constantes del dominio
 *
 * ACTUALIZADO: Campos Carta Porte 3.1 en ClientAddress
 * Las direcciones de clientes ahora almacenan códigos SAT para
 * facilitar la generación del complemento Carta Porte.
 *
 * REGLA: Esta capa NO debe importar nada de otras capas
 */

// ============================================================================
// ENUMS - Tipos enumerados del dominio
// ============================================================================

/**
 * Tipo de cliente
 */
export const ClientType = {
  INDIVIDUAL: "individual",
  COMPANY: "company",
} as const;

export type ClientTypeValue = (typeof ClientType)[keyof typeof ClientType];

/**
 * Términos de pago
 */
export const PaymentTerms = {
  CASH: "cash",
  CREDIT: "credit",
  PREPAID: "prepaid",
} as const;

export type PaymentTermsValue =
  (typeof PaymentTerms)[keyof typeof PaymentTerms];

/**
 * Tipo de dirección
 */
export const AddressType = {
  BILLING: "billing", // Facturación
  SHIPPING: "shipping", // Envío/Entrega
  PICKUP: "pickup", // Recolección
  WAREHOUSE: "warehouse", // Almacén/Bodega
  OFFICE: "office", // Oficina
  OTHER: "other", // Otro
} as const;

export type AddressTypeValue = (typeof AddressType)[keyof typeof AddressType];

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Entidad: Dirección de Cliente
 * Representa una dirección asociada a un cliente
 *
 * ACTUALIZADO: Incluye campos SAT para Carta Porte 3.1
 * Esto permite precargar automáticamente los datos de ubicación
 * cuando se selecciona una dirección del cliente en el wizard de viajes.
 */
export interface ClientAddress {
  readonly id: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly addressType: AddressTypeValue;
  readonly isPrimary: boolean; // Dirección principal
  readonly isActive: boolean;

  // ── Identificación del lugar ────────────────────────────────────────────
  readonly locationName: string | null; // Nombre del lugar (ej: "Bodega Central")

  // ── Ubicación SAT (Carta Porte 3.1) ─────────────────────────────────────
  /**
   * Código de Estado SAT (c_Estado)
   * Catálogo SAT de estados de México
   */
  readonly satEstadoCode: string | null;

  /**
   * Código de Municipio SAT (c_Municipio)
   * Catálogo SAT de municipios (filtrado por estado)
   */
  readonly satMunicipioCode: string | null;

  /**
   * Código Postal (5 dígitos)
   * Catálogo SAT de códigos postales
   */
  readonly postalCode: string | null;

  /**
   * Código de Localidad SAT (c_Localidad)
   * Catálogo SAT de localidades (filtrado por estado)
   * Opcional - principalmente para zonas rurales
   */
  readonly satLocalidadCode: string | null;

  /**
   * Código de Colonia SAT (c_Colonia)
   * Catálogo SAT de colonias (filtrado por código postal)
   * Opcional
   */
  readonly satColoniaCode: string | null;

  // ── Dirección desglosada ────────────────────────────────────────────────
  /**
   * Calle
   */
  readonly street: string | null;

  /**
   * Número exterior
   */
  readonly exteriorNumber: string | null;

  /**
   * Número interior
   */
  readonly interiorNumber: string | null;

  /**
   * Referencia (entre calles, cerca de...)
   */
  readonly reference: string | null;

  // ── Campos legacy (para compatibilidad) ─────────────────────────────────
  /**
   * @deprecated Usar campos desglosados (street, satColoniaCode, etc.)
   * Se mantiene para compatibilidad con datos existentes
   */
  readonly address: string;

  /**
   * @deprecated Usar satMunicipioCode
   * Se mantiene para compatibilidad con datos existentes
   */
  readonly city: string;

  /**
   * @deprecated Usar satEstadoCode
   * Se mantiene para compatibilidad con datos existentes
   */
  readonly state: string | null;

  /**
   * País (default: "México")
   * Para Carta Porte internacional, usar código ISO 3166-1 alpha-3
   */
  readonly country: string;

  // ── Coordenadas (opcional) ──────────────────────────────────────────────
  readonly latitude: number | null;
  readonly longitude: number | null;

  // ── Remitente/Destinatario (Carta Porte) ────────────────────────────────
  /**
   * RFC del remitente o destinatario en esta ubicación
   * Se usa cuando el cliente opera desde esta dirección
   */
  readonly rfcRemitenteDestinatario: string | null;

  /**
   * Nombre o razón social del remitente/destinatario
   */
  readonly nombreRemitenteDestinatario: string | null;

  // ── Información de contacto en esta dirección ───────────────────────────
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;

  // ── Horarios y notas ────────────────────────────────────────────────────
  readonly businessHours: string | null; // Ej: "Lun-Vie 8:00-17:00"
  readonly notes: string | null;
  readonly specialInstructions: string | null; // Instrucciones especiales de acceso

  // ── Auditoría ───────────────────────────────────────────────────────────
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Entidad: Cliente (referencia básica)
 */
export interface Client {
  readonly id: string;
  readonly tenantId: string;
  readonly clientCode: string;
  readonly legalName: string;
  readonly tradeName: string | null;
  readonly taxId: string;
  readonly type: ClientTypeValue;
  readonly paymentTerms: PaymentTermsValue;
  readonly creditDays: number;
  readonly creditLimit: number | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relaciones (opcionales, cuando se cargan con detalle)
  readonly addresses?: ClientAddress[];
}

/**
 * Entidad: Cliente con direcciones
 */
export interface ClientWithAddresses extends Client {
  readonly addresses: ClientAddress[];
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Dirección simplificada para listados
 * Incluye campos SAT para mostrar información relevante
 */
export interface ClientAddressListItem {
  readonly id: string;
  readonly addressType: AddressTypeValue;
  readonly isPrimary: boolean;
  readonly locationName: string | null;
  // Dirección completa formateada
  readonly fullAddress: string;
  // Campos SAT
  readonly satEstadoCode: string | null;
  readonly satMunicipioCode: string | null;
  readonly postalCode: string | null;
  // Contacto
  readonly contactName: string | null;
  readonly contactPhone: string | null;
}

/**
 * DTO para crear/actualizar dirección de cliente
 * Usado en formularios de captura
 */
export interface ClientAddressInput {
  addressType: AddressTypeValue;
  isPrimary?: boolean;
  isActive?: boolean;
  locationName?: string;
  // Campos SAT (requeridos para Carta Porte)
  satEstadoCode: string;
  satMunicipioCode: string;
  postalCode: string;
  satLocalidadCode?: string;
  satColoniaCode?: string;
  // Dirección desglosada
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  reference?: string;
  // Remitente/Destinatario
  rfcRemitenteDestinatario?: string;
  nombreRemitenteDestinatario?: string;
  // Contacto
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Horarios
  businessHours?: string;
  notes?: string;
  specialInstructions?: string;
  // Coordenadas
  latitude?: number;
  longitude?: number;
  // País (default: "México")
  country?: string;
}

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

/**
 * Etiquetas de tipo de dirección para UI
 */
export const ADDRESS_TYPE_LABELS: Record<AddressTypeValue, string> = {
  [AddressType.BILLING]: "Facturación",
  [AddressType.SHIPPING]: "Envío/Entrega",
  [AddressType.PICKUP]: "Recolección",
  [AddressType.WAREHOUSE]: "Almacén/Bodega",
  [AddressType.OFFICE]: "Oficina",
  [AddressType.OTHER]: "Otro",
};

/**
 * Etiquetas de tipo de cliente para UI
 */
export const CLIENT_TYPE_LABELS: Record<ClientTypeValue, string> = {
  [ClientType.INDIVIDUAL]: "Persona Física",
  [ClientType.COMPANY]: "Persona Moral",
};

/**
 * Etiquetas de términos de pago para UI
 */
export const PAYMENT_TERMS_LABELS: Record<PaymentTermsValue, string> = {
  [PaymentTerms.CASH]: "Contado",
  [PaymentTerms.CREDIT]: "Crédito",
  [PaymentTerms.PREPAID]: "Prepago",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatea una dirección completa a partir de los campos desglosados
 */
export function formatFullAddress(address: Partial<ClientAddress>): string {
  const parts: string[] = [];

  if (address.street) {
    let streetPart = address.street;
    if (address.exteriorNumber) {
      streetPart += ` #${address.exteriorNumber}`;
    }
    if (address.interiorNumber) {
      streetPart += `, Int. ${address.interiorNumber}`;
    }
    parts.push(streetPart);
  }

  // Usar campo legacy si no hay street
  if (!address.street && address.address) {
    parts.push(address.address);
  }

  if (address.postalCode) {
    parts.push(`C.P. ${address.postalCode}`);
  }

  // Para ciudad/estado, preferir campos legacy ya que son texto legible
  if (address.city) {
    parts.push(address.city);
  }
  if (address.state) {
    parts.push(address.state);
  }

  return parts.join(", ");
}

/**
 * Verifica si una dirección tiene todos los campos SAT requeridos para Carta Porte
 */
export function isCartaPorteReady(address: Partial<ClientAddress>): boolean {
  return !!(
    address.satEstadoCode &&
    address.satMunicipioCode &&
    address.postalCode
  );
}
